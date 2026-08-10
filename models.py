from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime



class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id = Column(Integer,primary_key=True,index=True)
    medicine_name = Column(String(150),nullable=False)
    unit_price = Column(Float,nullable=False)
    expiry_date = Column(Date)
    description = Column(String(255))

    category_id = Column(Integer,ForeignKey("categories.category_id"))
    supplier_id = Column(Integer,ForeignKey("suppliers.supplier_id"))

    category = relationship("Category", back_populates="medicines")
    supplier = relationship("Supplier", back_populates="medicines")
    

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

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    action = Column(String)
    table_name = Column(String)
    record_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)    