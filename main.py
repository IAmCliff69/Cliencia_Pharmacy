from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from database import engine, get_db

# ✅ Import auth router
from app.auth.routes import router as auth_router

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
    return crud.get_sales(db)


# ✅ READ ONE → STAFF + ADMIN
@app.get("/sales/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    sale = crud.get_sale_by_id(db, sale_id)

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
    summary = crud.get_sales_summary(db, start_date, end_date)
    summary["top_medicines"] = crud.get_top_medicines(db)

    return summary