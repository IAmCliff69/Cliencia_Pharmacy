"""
One-time bootstrap script to create (or promote) an admin user.

Run with:
    python create_admin.py

This bypasses the API entirely and writes directly to the database,
which is why it's a standalone script rather than an endpoint --
you need at least one admin to exist before any admin-only endpoint
can be used.
"""

import getpass

from database import SessionLocal
from app.auth.models import User
from app.auth.utils import hash_password


def main():
    db = SessionLocal()

    try:
        print("=== Create Cliencia Pharmacy Admin ===")
        first_name = input("First name: ").strip()
        last_name = input("Last name: ").strip()
        email = input("Email: ").strip()
        password = getpass.getpass("Password: ")

        existing = db.query(User).filter(User.email == email).first()

        if existing:
            print(f"A user with email '{email}' already exists (role: {existing.role}).")
            choice = input("Promote this user to admin instead? (y/n): ").strip().lower()

            if choice == "y":
                existing.role = "admin"
                db.commit()
                print(f"'{email}' is now an admin.")
            else:
                print("No changes made.")

            return

        admin = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hash_password(password),
            role="admin"
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f"Admin account created: {admin.email} (user_id={admin.user_id})")

    finally:
        db.close()


if __name__ == "__main__":
    main()