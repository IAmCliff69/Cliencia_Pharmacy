from pydantic import BaseModel
from datetime import date


class MedicineCreate(BaseModel):

    medicine_name: str
    category_id: int
    supplier_id: int
    description: str
    unit_price: float
    expiry_date: date



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


class CategoryResponse(BaseModel):
    category_id: int
    category_name: str

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