from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Numeric, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime



class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String(150), nullable=False)
    unit_price = Column(Float, nullable=False)
    expiry_date = Column(Date)
    description = Column(String(255))

    category_id = Column(Integer, ForeignKey("categories.category_id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"))

    category = relationship("Category", back_populates="medicines")
    supplier = relationship("Supplier", back_populates="medicines")

    # One-to-one: each medicine has exactly one inventory record
    inventory = relationship(
        "Inventory",
        back_populates="medicine",
        uselist=False
    )


class Category(Base):

    __tablename__ = "categories"

    category_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    category_name = Column(
        String(100),
        nullable=False,
        unique=True
    )

    description = Column(Text, nullable=True)

    medicines = relationship("Medicine", back_populates="category")


class Supplier(Base):

    __tablename__ = "suppliers"

    supplier_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    supplier_name = Column(
        String(150),
        nullable=False
    )

    contact_person = Column(
        String(150)
    )

    phone = Column(
        String(20)
    )

    email = Column(
        String(150)
    )

    address = Column(
        String(255)
    )

    medicines = relationship("Medicine", back_populates="supplier")


class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True, index=True)

    medicine_id = Column(
        Integer,
        ForeignKey("medicines.medicine_id"),
        unique=True
    )

    quantity_available = Column(Integer, default=0)
    minimum_stock_level = Column(Integer, default=10)
    last_updated = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    medicine = relationship("Medicine", back_populates="inventory")


class Sale(Base):
    __tablename__ = "sales"

    sale_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    customer_name = Column(String(150), nullable=True)
    sale_date = Column(DateTime, default=datetime.utcnow)
    total_amount = Column(Numeric(10, 2))
    is_voided = Column(Boolean, default=False, nullable=False)
    voided_at = Column(DateTime, nullable=True)

    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    sale_item_id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.sale_id"))
    medicine_id = Column(Integer, ForeignKey("medicines.medicine_id"))
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
    medicine = relationship("Medicine")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    action = Column(String(100))
    table_name = Column(String(100))
    record_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)