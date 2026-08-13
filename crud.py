from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from models import Medicine, Category, Supplier, AuditLog, Inventory, Sale, SaleItem


# -----------------------------
# MEDICINE CRUD
# -----------------------------

def create_medicine(db: Session, medicine):

    category = db.query(Category).filter(
        Category.category_id == medicine.category_id
    ).first()

    if not category:
        return {"error": "Category not found"}

    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == medicine.supplier_id
    ).first()

    if not supplier:
        return {"error": "Supplier not found"}

    medicine_fields = medicine.model_dump(
        exclude={"initial_quantity", "minimum_stock_level"}
    )

    new_medicine = Medicine(**medicine_fields)

    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    # Every medicine gets exactly one inventory record at creation time
    inventory_row = Inventory(
        medicine_id=new_medicine.medicine_id,
        quantity_available=medicine.initial_quantity,
        minimum_stock_level=medicine.minimum_stock_level
    )

    db.add(inventory_row)
    db.commit()
    db.refresh(new_medicine)

    return new_medicine


def get_medicines(db: Session):
    return db.query(Medicine).options(joinedload(Medicine.inventory)).all()


def get_low_stock_medicines(db: Session):
    return (
        db.query(Medicine)
        .join(Inventory, Medicine.medicine_id == Inventory.medicine_id)
        .options(joinedload(Medicine.inventory))
        .filter(Inventory.quantity_available <= Inventory.minimum_stock_level)
        .all()
    )


def get_medicine_by_id(db: Session, medicine_id: int):
    return (
        db.query(Medicine)
        .options(joinedload(Medicine.inventory))
        .filter(Medicine.medicine_id == medicine_id)
        .first()
    )


def update_medicine(db: Session, medicine_id: int, updated_data):

    medicine = db.query(Medicine).filter(
        Medicine.medicine_id == medicine_id
    ).first()

    if not medicine:
        return {"error": "Medicine not found"}

    category = db.query(Category).filter(
        Category.category_id == updated_data.category_id
    ).first()

    if not category:
        return {"error": "Category not found"}

    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == updated_data.supplier_id
    ).first()

    if not supplier:
        return {"error": "Supplier not found"}

    for key, value in updated_data.model_dump(
        exclude={"initial_quantity", "minimum_stock_level"}
    ).items():
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

    # Remove the linked inventory row first (FK would otherwise block this)
    inventory_row = db.query(Inventory).filter(
        Inventory.medicine_id == medicine_id
    ).first()

    if inventory_row:
        db.delete(inventory_row)

    db.delete(medicine)
    db.commit()

    return {"message": "Medicine deleted successfully"}


def adjust_stock(db: Session, medicine_id: int, change: int):
    """
    Adjust quantity_available in the medicine's inventory record.
    Positive change = restock, negative = dispense/sell.
    Refuses to go below zero.
    """

    inventory_row = db.query(Inventory).filter(
        Inventory.medicine_id == medicine_id
    ).first()

    if not inventory_row:
        return {"error": "Medicine not found (or has no inventory record)"}

    new_quantity = inventory_row.quantity_available + change

    if new_quantity < 0:
        return {"error": "Insufficient stock for this adjustment"}

    inventory_row.quantity_available = new_quantity

    db.commit()
    db.refresh(inventory_row)

    # Return the parent medicine (with inventory attached) so the
    # endpoint can respond with a consistent MedicineWithStockResponse
    return db.query(Medicine).options(joinedload(Medicine.inventory)).filter(
        Medicine.medicine_id == medicine_id
    ).first()


# -----------------------------
# CATEGORY CRUD
# -----------------------------

def create_category(db: Session, category):

    new_category = Category(**category.model_dump())

    db.add(new_category)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"error": "A category with this name already exists"}

    db.refresh(new_category)

    return new_category


def get_categories(db: Session):
    return db.query(Category).all()


def update_category(db: Session, category_id: int, updated_data):

    category = db.query(Category).filter(
        Category.category_id == category_id
    ).first()

    if not category:
        return {"error": "Category not found"}

    for key, value in updated_data.model_dump().items():
        setattr(category, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"error": "A category with this name already exists"}

    db.refresh(category)

    return category


def delete_category(db: Session, category_id: int):

    category = db.query(Category).filter(
        Category.category_id == category_id
    ).first()

    if not category:
        return {"error": "Category not found"}

    linked_medicines = db.query(Medicine).filter(
        Medicine.category_id == category_id
    ).count()

    if linked_medicines > 0:
        return {
            "error": f"Cannot delete: {linked_medicines} medicine(s) still use this category"
        }

    db.delete(category)
    db.commit()

    return {"message": "Category deleted successfully"}


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


def update_supplier(db: Session, supplier_id: int, updated_data):

    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if not supplier:
        return {"error": "Supplier not found"}

    for key, value in updated_data.model_dump().items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)

    return supplier


def delete_supplier(db: Session, supplier_id: int):

    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if not supplier:
        return {"error": "Supplier not found"}

    linked_medicines = db.query(Medicine).filter(
        Medicine.supplier_id == supplier_id
    ).count()

    if linked_medicines > 0:
        return {
            "error": f"Cannot delete: {linked_medicines} medicine(s) still use this supplier"
        }

    db.delete(supplier)
    db.commit()

    return {"message": "Supplier deleted successfully"}


def create_audit_log(db, user_id: int, action: str, table: str, record_id: int):
    log = AuditLog(
        user_id=user_id,
        action=action,
        table_name=table,
        record_id=record_id
    )
    db.add(log)
    db.commit()


# -----------------------------
# SALE CRUD (POS)
# -----------------------------

def create_sale(db: Session, sale_data, user_id: int):

    if not sale_data.items:
        return {"error": "A sale must include at least one item"}

    # Validate every line item BEFORE making any changes, so a sale
    # either fully succeeds or fails cleanly with nothing half-applied.
    items_to_process = []

    for item in sale_data.items:

        medicine = db.query(Medicine).filter(
            Medicine.medicine_id == item.medicine_id
        ).first()

        if not medicine:
            return {"error": f"Medicine id {item.medicine_id} not found"}

        if item.quantity <= 0:
            return {"error": f"Quantity for '{medicine.medicine_name}' must be positive"}

        inventory_row = db.query(Inventory).filter(
            Inventory.medicine_id == item.medicine_id
        ).first()

        available = inventory_row.quantity_available if inventory_row else 0

        if available < item.quantity:
            return {
                "error": (
                    f"Insufficient stock for '{medicine.medicine_name}' "
                    f"(requested {item.quantity}, available {available})"
                )
            }

        items_to_process.append({
            "medicine": medicine,
            "inventory": inventory_row,
            "quantity": item.quantity,
            "price": medicine.unit_price
        })

    total_amount = sum(
        entry["price"] * entry["quantity"] for entry in items_to_process
    )

    new_sale = Sale(
        user_id=user_id,
        customer_name=sale_data.customer_name,
        total_amount=total_amount
    )

    db.add(new_sale)
    db.flush()  # assigns new_sale.sale_id without a full commit yet

    for entry in items_to_process:

        sale_item = SaleItem(
            sale_id=new_sale.sale_id,
            medicine_id=entry["medicine"].medicine_id,
            quantity=entry["quantity"],
            price=entry["price"]
        )

        db.add(sale_item)

        entry["inventory"].quantity_available -= entry["quantity"]

    db.commit()
    db.refresh(new_sale)

    return new_sale


def get_sales(db: Session):
    return db.query(Sale).options(joinedload(Sale.items)).all()


def get_sale_by_id(db: Session, sale_id: int):
    return (
        db.query(Sale)
        .options(joinedload(Sale.items))
        .filter(Sale.sale_id == sale_id)
        .first()
    )