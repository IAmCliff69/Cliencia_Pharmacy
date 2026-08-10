from pyexpat import model

from sqlalchemy.orm import Session
from models import Medicine, Category, Supplier


# -----------------------------
# MEDICINE CRUD
# -----------------------------

def create_medicine(db: Session, medicine):

    # Check if category exists
    category = db.query(Category).filter(
        Category.category_id == medicine.category_id
    ).first()

    if not category:
        return {"error": "Category not found"}

    # Check if supplier exists
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == medicine.supplier_id
    ).first()

    if not supplier:
        return {"error": "Supplier not found"}

    # Create medicine
    new_medicine = Medicine(**medicine.model_dump())

    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    return new_medicine


def get_medicines(db: Session):
    return db.query(Medicine).all()


def get_medicine_by_id(db: Session, medicine_id: int):
    return db.query(Medicine).filter(
        Medicine.medicine_id == medicine_id
    ).first()


def update_medicine(db: Session, medicine_id: int, updated_data):

    medicine = db.query(Medicine).filter(
        Medicine.medicine_id == medicine_id
    ).first()

    if not medicine:
        return {"error": "Medicine not found"}

    # Optional: Validate category
    category = db.query(Category).filter(
        Category.category_id == updated_data.category_id
    ).first()

    if not category:
        return {"error": "Category not found"}

    # Optional: Validate supplier
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == updated_data.supplier_id
    ).first()

    if not supplier:
        return {"error": "Supplier not found"}

    # Update fields
    for key, value in updated_data.model_dump().items():
        setattr(medicine, key, value)

    db.commit()
    db.refresh(medicine)

    return medicine


def delete_medicine(db: Session, medicine_id: int):

    medicine = db.query(Medicine).filter(
        Medicine.medicine_id == medicine_id
    ).first()

    if not medicine:
        return {"error": "Medicine not found"}

    db.delete(medicine)
    db.commit()

    return {"message": "Medicine deleted successfully"}


# -----------------------------
# CATEGORY CRUD
# -----------------------------

def create_category(db: Session, category):

    new_category = Category(**category.model_dump())

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


def get_categories(db: Session):
    return db.query(Category).all()


# -----------------------------
# SUPPLIER CRUD
# -----------------------------

def create_supplier(db: Session, supplier):

    new_supplier = Supplier(**supplier.model_dump())

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    return new_supplier


def get_suppliers(db: Session):
    return db.query(Supplier).all()

def create_audit_log(db, user_id: int, action: str, table: str, record_id: int):
    log = model.AuditLog(
        user_id=user_id,
        action=action,
        table_name=table,
        record_id=record_id
    )
    db.add(log)
    db.commit()