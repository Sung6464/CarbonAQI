from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


def initialize_app():
    if firebase_admin._apps:
        return
    cred_path = Path(__file__).resolve().parents[1] / "firebase_key.json"
    firebase_admin.initialize_app(credentials.Certificate(str(cred_path)))


def delete_collection(db, collection_name):
    deleted = 0
    docs = db.collection(collection_name).stream()
    for doc in docs:
        doc.reference.delete()
        deleted += 1
        print(f"deleted {collection_name}/{doc.id}")
    return deleted


def delete_all_firestore_data():
    initialize_app()
    db = firestore.client()

    total_users = delete_collection(db, "users")
    total_companies = delete_collection(db, "companies")

    print(f"total_deleted_users={total_users}")
    print(f"total_deleted_companies={total_companies}")


if __name__ == "__main__":
    delete_all_firestore_data()
