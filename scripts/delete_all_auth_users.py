from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials


def initialize_app():
    if firebase_admin._apps:
        return
    cred_path = Path(__file__).resolve().parents[1] / "firebase_key.json"
    firebase_admin.initialize_app(credentials.Certificate(str(cred_path)))


def delete_all_auth_users():
    initialize_app()

    deleted = 0
    page = auth.list_users()
    while page:
        for user in page.users:
            auth.delete_user(user.uid)
            deleted += 1
            print(f"deleted {user.uid}")
        page = page.get_next_page()

    print(f"total_deleted={deleted}")


if __name__ == "__main__":
    delete_all_auth_users()
