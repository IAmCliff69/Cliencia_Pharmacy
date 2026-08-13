from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class MedicineCreate(BaseModel):

    medicine_name: str
    category_id: int
    supplier_id: int
    description: str
    unit_price: float
    expiry_date: date
    initial_quantity: int = 0
    minimum_stock_level: int = 10



class MedicineResponse(BaseModel):

    medicine_id: int
    medicine_name: str
    category_id: int
    supplier_id: int
    description: str
    unit_price: float
    expiry_date: date


    class Config:
        from_attributes = True        


class CategoryCreate(BaseModel):
    category_name: str
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    category_id: int
    category_name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True   



class SupplierCreate(BaseModel):
    supplier_name: str
    contact_person: str
    phone: str
    email: str
    address: str


class SupplierResponse(BaseModel):

    supplier_id: int
    supplier_name: str
    contact_person: str
    phone: str
    email: str
    address: str

    class Config:
        from_attributes = True


# -----------------------------
# Inventory Schemas
# -----------------------------

class InventoryResponse(BaseModel):

    inventory_id: int
    medicine_id: int
    quantity_available: int
    minimum_stock_level: int
    last_updated: datetime

    class Config:
        from_attributes = True


# Medicine response that includes its inventory info nested,
# used for the low-stock and detail views.
class MedicineWithStockResponse(MedicineResponse):
    inventory: Optional[InventoryResponse] = None


# -----------------------------
# Sale / POS Schemas
# -----------------------------

class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int


class SaleCreate(BaseModel):
    customer_name: Optional[str] = None
    items: list[SaleItemCreate]


class SaleItemResponse(BaseModel):
    sale_item_id: int
    medicine_id: int
    quantity: int
    price: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    sale_id: int
    user_id: int
    customer_name: Optional[str] = None
    sale_date: datetime
    total_amount: float
    items: list[SaleItemResponse] = []

    class Config:
        from_attributes = True    