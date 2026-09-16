from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from database import engine, get_db


# ✅ Import auth router
from app.auth.routes import router as auth_router
from app.auth.models import User

# ✅ Import role-based dependencies
from app.auth.dependencies import require_admin, require_staff

# ✅ Import DB and modules
import models
import schemas
import crud


# -----------------------------
# CREATE DATABASE TABLES
# -----------------------------
# Note: table creation is now also managed by Alembic migrations.
# This call is harmless (create_all skips tables that already exist)
# and is kept as a safety net for a totally fresh database, but any
# schema CHANGES from here on should go through an Alembic migration,
# not by editing models.py alone.
models.Base.metadata.create_all(bind=engine)


# -----------------------------
# CREATE FASTAPI APP
# -----------------------------
app = FastAPI(
    title="ClienciaPharm API",
    description="Pharmacy Inventory Management System API",
    version="1.0.0"
)

Path("uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# -----------------------------
# CORS CONFIGURATION
# -----------------------------
# Allows the React (Vite) frontend, running on a different port during
# development, to make requests to this API. Without this, the browser
# blocks the requests before they even reach FastAPI.
origins = [
    "http://localhost:5173",   # Vite dev server default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# REGISTER AUTH ROUTES
# -----------------------------
app.include_router(auth_router)


# -----------------------------
# HOME ROUTE
# -----------------------------
@app.get("/")
def home():
    return {"message": "ClienciaPharm API is running"}


# =========================================================
# 🔒 MEDICINE ROUTES
# =========================================================

# ✅ CREATE → STAFF + ADMIN
@app.post("/medicines/", response_model=schemas.MedicineWithStockResponse, status_code=201)
def create_medicine(
    medicine: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    result = crud.create_medicine(db, medicine)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="CREATE",
        table="medicines",
        record_id=result.medicine_id
    )

    return result


# ✅ READ → STAFF + ADMIN
# Supports optional search/filter (name, category_id, supplier_id)
# and pagination (skip, limit).
@app.get("/medicines/", response_model=list[schemas.MedicineWithStockResponse])
def get_medicines(
    name: Optional[str] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_medicines(db, name, category_id, supplier_id, skip, limit)


# ✅ LOW STOCK / EXPIRY → STAFF + ADMIN
# NOTE: these routes must be declared BEFORE /medicines/{medicine_id}
# otherwise FastAPI will try to parse the path segment as an int
# medicine_id and return a 422 error instead of matching these routes.
@app.get("/medicines/low-stock", response_model=list[schemas.MedicineWithStockResponse])
def get_low_stock_medicines(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_low_stock_medicines(db)


@app.get("/medicines/expiring-soon", response_model=list[schemas.MedicineWithStockResponse])
def get_expiring_medicines(
    days: int = Query(30, ge=1, description="Medicines expiring within this many days"),
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_expiring_medicines(db, days)


@app.get("/medicines/expired", response_model=list[schemas.MedicineWithStockResponse])
def get_expired_medicines(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_expired_medicines(db)


# ✅ READ ONE → STAFF + ADMIN
@app.get("/medicines/{medicine_id}", response_model=schemas.MedicineWithStockResponse)
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    medicine = crud.get_medicine_by_id(db, medicine_id)

    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    return medicine


# 🔒 UPDATE → ADMIN ONLY
@app.put("/medicines/{medicine_id}", response_model=schemas.MedicineResponse)
def update_medicine(
    medicine_id: int,
    updated_data: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.update_medicine(db, medicine_id, updated_data)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="UPDATE",
        table="medicines",
        record_id=result.medicine_id
    )

    return result


# ✅ ADJUST STOCK → STAFF + ADMIN
# For day-to-day restocking or dispensing without needing the full
# update form. Positive change = restock, negative change = dispense/sell.
@app.patch("/medicines/{medicine_id}/stock", response_model=schemas.MedicineWithStockResponse)
def adjust_medicine_stock(
    medicine_id: int,
    change: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    result = crud.adjust_stock(db, medicine_id, change)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action=f"STOCK_ADJUST({change:+d})",
        table="medicines",
        record_id=result.medicine_id
    )

    return result


# 🔒 DELETE → ADMIN ONLY
@app.delete("/medicines/{medicine_id}", status_code=204)
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.delete_medicine(db, medicine_id)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="DELETE",
        table="medicines",
        record_id=medicine_id
    )

    return {"message": "Deleted successfully"}


# =========================================================
# 🔒 CATEGORY ROUTES
# =========================================================

# 🔒 CREATE → ADMIN ONLY
@app.post("/categories/", response_model=schemas.CategoryResponse, status_code=201)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.create_category(db, category)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="CREATE",
        table="categories",
        record_id=result.category_id
    )

    return result


# ✅ READ → STAFF + ADMIN
@app.get("/categories/", response_model=list[schemas.CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_categories(db)


# 🔒 UPDATE → ADMIN ONLY
@app.put("/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    updated_data: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.update_category(db, category_id, updated_data)

    if isinstance(result, dict) and "error" in result:
        status_code = 404 if "not found" in result["error"] else 400
        raise HTTPException(status_code=status_code, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="UPDATE",
        table="categories",
        record_id=result.category_id
    )

    return result


# 🔒 DELETE → ADMIN ONLY
@app.delete("/categories/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.delete_category(db, category_id)

    if isinstance(result, dict) and "error" in result:
        status_code = 404 if "not found" in result["error"] else 400
        raise HTTPException(status_code=status_code, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="DELETE",
        table="categories",
        record_id=category_id
    )

    return {"message": "Deleted successfully"}


# =========================================================
# 🔒 SUPPLIER ROUTES
# =========================================================

# 🔒 CREATE → ADMIN ONLY
@app.post("/suppliers/", response_model=schemas.SupplierResponse, status_code=201)
def create_supplier(
    supplier: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.create_supplier(db, supplier)

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="CREATE",
        table="suppliers",
        record_id=result.supplier_id
    )

    return result


# ✅ READ → STAFF + ADMIN
@app.get("/suppliers/", response_model=list[schemas.SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_suppliers(db)


# 🔒 UPDATE → ADMIN ONLY
@app.put("/suppliers/{supplier_id}", response_model=schemas.SupplierResponse)
def update_supplier(
    supplier_id: int,
    updated_data: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.update_supplier(db, supplier_id, updated_data)

    if isinstance(result, dict) and "error" in result:
        status_code = 404 if "not found" in result["error"] else 400
        raise HTTPException(status_code=status_code, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="UPDATE",
        table="suppliers",
        record_id=result.supplier_id
    )

    return result


# 🔒 DELETE → ADMIN ONLY
@app.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.delete_supplier(db, supplier_id)

    if isinstance(result, dict) and "error" in result:
        status_code = 404 if "not found" in result["error"] else 400
        raise HTTPException(status_code=status_code, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="DELETE",
        table="suppliers",
        record_id=supplier_id
    )

    return {"message": "Deleted successfully"}


# =========================================================
# 🔒 SALE ROUTES (POS)
# =========================================================

# ✅ CREATE → STAFF + ADMIN
# Prices are always taken from the medicine's current unit_price on
# the server, never from the client, and stock is validated for every
# item before anything is written -- a sale either fully succeeds or
# fails cleanly with nothing partially applied.
@app.post("/sales/", response_model=schemas.SaleResponse, status_code=201)
def create_sale(
    sale: schemas.SaleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    result = crud.create_sale(db, sale, current_user.user_id)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="CREATE",
        table="sales",
        record_id=result.sale_id
    )

    return result


# ✅ READ → STAFF + ADMIN
@app.get("/sales/", response_model=list[schemas.SaleResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    user_id = None if current_user.role.strip().lower() == "admin" else current_user.user_id
    return crud.get_sales(db, user_id=user_id)


# ✅ READ ONE → STAFF + ADMIN
@app.get("/sales/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    user_id = None if current_user.role.strip().lower() == "admin" else current_user.user_id
    sale = crud.get_sale_by_id(db, sale_id, user_id=user_id)

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    return sale


# 🔒 VOID → ADMIN ONLY
# Voiding is a financially sensitive action, so it's restricted to
# admins even though creating a sale is open to staff. Restores stock
# for every item and marks the sale as voided rather than deleting it,
# preserving the record for audit purposes.
@app.patch("/sales/{sale_id}/void", response_model=schemas.SaleResponse)
def void_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    result = crud.void_sale(db, sale_id)

    if isinstance(result, dict) and "error" in result:
        status_code = 404 if "not found" in result["error"] else 400
        raise HTTPException(status_code=status_code, detail=result["error"])

    crud.create_audit_log(
        db,
        user_id=current_user.user_id,
        action="VOID",
        table="sales",
        record_id=result.sale_id
    )

    return result

# =========================================================
# 🔒 SHIFT / SESSION ROUTES
# =========================================================

# ✅ CHECK ACTIVE SHIFT → STAFF + ADMIN
# Used by the frontend to know if the current user has an
# open shift before allowing POS access.
@app.get("/shifts/active", response_model=schemas.ShiftResponse)
def get_active_shift(
    db: Session = Depends(get_db),
    current_user=Depends(require_staff)
):
    shift = crud.get_active_shift(db, current_user.user_id)
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active shift found"
        )
    return shift


# ✅ OPEN SHIFT → STAFF + ADMIN
@app.post("/shifts/open", response_model=schemas.ShiftResponse)
def open_shift(
    db: Session = Depends(get_db),
    current_user=Depends(require_staff)
):
    result = crud.open_shift(db, current_user.user_id)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    return result


# ✅ CLOSE SHIFT → STAFF + ADMIN
@app.patch("/shifts/close", response_model=schemas.ShiftSummaryResponse)
def close_shift(
    db: Session = Depends(get_db),
    current_user=Depends(require_staff)
):
    shift = crud.close_shift(db, current_user.user_id)
    if isinstance(shift, dict) and "error" in shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=shift["error"]
        )
    return crud.get_shift_summary(db, shift)


# ✅ MY SHIFT HISTORY → STAFF + ADMIN
# Returns all of the current user's shifts with sales summaries.
@app.get("/shifts/my", response_model=list[schemas.ShiftSummaryResponse])
def get_my_shifts(
    db: Session = Depends(get_db),
    current_user=Depends(require_staff)
):
    shifts = crud.get_my_shifts(db, current_user.user_id)
    return [crud.get_shift_summary(db, s) for s in shifts]


# ✅ ALL SHIFTS → ADMIN ONLY
# Admin sees every shift from every user with summaries.
@app.get("/shifts/", response_model=list[schemas.ShiftSummaryResponse])
def get_all_shifts(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    shifts = crud.get_all_shifts(db)
    return [crud.get_shift_summary(db, s) for s in shifts]

# =========================================================
# 🔒 REPORTING ROUTES
# =========================================================

# ✅ SALES SUMMARY → STAFF + ADMIN
# Optional start_date/end_date (YYYY-MM-DD) narrow the window;
# omitting both reports across all-time sales. Voided sales are
# excluded from totals. Includes a top-10 best-selling medicines
# breakdown by quantity sold.
@app.get("/reports/sales-summary", response_model=schemas.SalesSummaryResponse)
def get_sales_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    user_id = None if current_user.role.strip().lower() == "admin" else current_user.user_id
    summary = crud.get_sales_summary(db, start_date, end_date, user_id=user_id)
    summary["top_medicines"] = crud.get_top_medicines(
        db, start_date=start_date, end_date=end_date, user_id=user_id
    )

    return summary


@app.get("/reports/sales-pdf")
def download_sales_report_pdf(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff),
):
    is_admin = current_user.role.strip().lower() == "admin"
    user_id = None if is_admin else current_user.user_id
    report_start = start_date or date.today()
    report_end = end_date or report_start
    sales = crud.get_sales(
        db,
        user_id=user_id,
        start_date=report_start,
        end_date=report_end,
    )
    staff_names = {
        staff.user_id: f"{staff.first_name} {staff.last_name}"
        for staff in db.query(User).filter(
            User.user_id.in_({sale.user_id for sale in sales})
        ).all()
    }

    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Cliencia Pharmacy Sales Report", styles["Title"]),
        Paragraph(
            f"{'All users' if is_admin else current_user.first_name + ' ' + current_user.last_name} | {report_start} to {report_end}",
            styles["Normal"],
        ),
        Spacer(1, 10),
    ]
    rows = [["Sale", "Staff", "Customer", "Date", "Amount", "Status"]]
    total = 0.0
    for sale in sales:
        amount = float(sale.total_amount)
        if not sale.is_voided:
            total += amount
        rows.append([
            f"#{sale.sale_id}",
            staff_names.get(sale.user_id, f"Staff #{sale.user_id}"),
            sale.customer_name or "Walk-in",
            sale.sale_date.strftime("%d %b %Y %H:%M"),
            f"GH₵{amount:.2f}",
            "Voided" if sale.is_voided else "Completed",
        ])
    if len(rows) == 1:
        rows.append(["-", "-", "No sales", "-", "GH₵0.00", "-"])
    rows.append(["", "", "", "", f"GH₵{total:.2f}", "Net total"])
    table = Table(rows, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#123f52")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#c9eaf3")),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#dff6fb")),
        ("ALIGN", (4, 1), (4, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    document.build(story)
    buffer.seek(0)
    filename = f"sales-report-{report_start}-{report_end}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/reports/shift-pdf/{shift_id}")
def download_shift_report_pdf(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff),
):
    shift = db.query(models.Shift).filter(models.Shift.shift_id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    is_admin = current_user.role.strip().lower() == "admin"
    if not is_admin and shift.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only download your own shift reports")

    sales = crud.get_sales_for_shift(db, shift)
    staff = db.query(User).filter(User.user_id == shift.user_id).first()
    staff_name = f"{staff.first_name} {staff.last_name}" if staff else f"Staff #{shift.user_id}"
    shift_end = shift.closed_at or datetime.utcnow()

    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Cliencia Pharmacy Shift Report", styles["Title"]),
        Paragraph(
            f"{staff_name} | {shift.opened_at.strftime('%d %b %Y %H:%M')} to "
            f"{shift_end.strftime('%d %b %Y %H:%M')}",
            styles["Normal"],
        ),
        Spacer(1, 10),
    ]
    rows = [["Sale", "Customer", "Date", "Amount", "Status"]]
    total = 0.0
    for sale in sales:
        amount = float(sale.total_amount)
        if not sale.is_voided:
            total += amount
        rows.append([
            f"#{sale.sale_id}",
            sale.customer_name or "Walk-in",
            sale.sale_date.strftime("%d %b %Y %H:%M"),
            f"GH₵{amount:.2f}",
            "Voided" if sale.is_voided else "Completed",
        ])
    if len(rows) == 1:
        rows.append(["-", "No sales", "-", "GH₵0.00", "-"])
    rows.append(["", "", "", f"GH₵{total:.2f}", "Net total"])
    table = Table(rows, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#123f52")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#c9eaf3")),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#dff6fb")),
        ("ALIGN", (3, 1), (3, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    document.build(story)
    buffer.seek(0)
    filename = f"shift-report-{shift.shift_id}-{shift.opened_at.date()}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )