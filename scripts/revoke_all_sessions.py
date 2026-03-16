from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials


def initialize_app():
    if firebase_admin._apps:
        return
    cred_path = Path(__file__).resolve().parents[1] / "firebase_key.json"
    firebase_admin.initialize_app(credentials.Certificate(str(cred_path)))


def revoke_all_sessions():
    initialize_app()

    revoked = 0
    page = auth.list_users()
    while page:
        for user in page.users:
            auth.revoke_refresh_tokens(user.uid)
            revoked += 1
            print(f"revoked {user.uid}")
        page = page.get_next_page()

    print(f"total_revoked={revoked}")


if __name__ == "__main__":
    revoke_all_sessions()
