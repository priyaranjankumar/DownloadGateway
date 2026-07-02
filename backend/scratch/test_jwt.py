import jwt
from datetime import datetime, timedelta, timezone

secret = "a91d9526010ef51014950293fd2b2c327019ce61ecb2b7a3e6c0a923fd4d54a6"
expire = datetime.now(timezone.utc) + timedelta(minutes=1440)
payload = {
    "sub": "ranjan",
    "exp": expire,
}

# Test encode
token = jwt.encode(payload, secret, algorithm="HS256")
print("Encoded Token:", token)

# Test decode
try:
    decoded = jwt.decode(token, secret, algorithms=["HS256"])
    print("Decoded Successfully:", decoded)
except Exception as e:
    print("Decode Failed:", str(e))
