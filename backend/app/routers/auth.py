from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password, create_access_token, get_current_user
)
from app.models.models import User, AuthProvider
from app.schemas.schemas import (
    SignupRequest, LoginRequest, GoogleSSORequest, TokenResponse, UserOut,
    UserUpdateRequest
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        provider=AuthProvider.local,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled.")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/google", response_model=TokenResponse)
def google_sso(payload: GoogleSSORequest, db: Session = Depends(get_db)):
    """
    Verify a Google Identity Services ID token from the frontend
    (Google Sign-In button) and log the user in / create their account.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google SSO is not configured on the server.")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token.")

    email = idinfo.get("email")
    sub = idinfo.get("sub")
    name = idinfo.get("name") or (email.split("@")[0] if email else "User")

    if not email or not sub:
        raise HTTPException(status_code=400, detail="Google token missing required fields.")

    user = db.query(User).filter(User.google_sub == sub).first()
    if not user:
        user = db.query(User).filter(User.email == email.lower()).first()

    if not user:
        user = User(
            name=name,
            email=email.lower(),
            provider=AuthProvider.google,
            google_sub=sub,
            hashed_password=None,
        )
        db.add(user)
    else:
        if not user.google_sub:
            user.google_sub = sub
            user.provider = AuthProvider.google

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()
    if payload.address is not None:
        current_user.address = payload.address.strip()
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/logout")
def logout():
    # Stateless JWT — logout is handled client-side by discarding the token.
    return {"detail": "Logged out. Discard the access token on the client."}
