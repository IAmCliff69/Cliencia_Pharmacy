from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
@app.post("/medicines/", response_model=schemas.MedicineResponse, status_code=201)
def create_medicine(
    medicine: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    result = crud.create_medicine(db, medicine)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


# ✅ READ → STAFF + ADMIN
@app.get("/medicines/", response_model=list[schemas.MedicineResponse])
def get_medicines(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_medicines(db)


# ✅ READ ONE → STAFF + ADMIN
@app.get("/medicines/{medicine_id}", response_model=schemas.MedicineResponse)
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
    return crud.create_category(db, category)


# ✅ READ → STAFF + ADMIN
@app.get("/categories/", response_model=list[schemas.CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_categories(db)


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
    return crud.create_supplier(db, supplier)


# ✅ READ → STAFF + ADMIN
@app.get("/suppliers/", response_model=list[schemas.SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    return crud.get_suppliers(db)