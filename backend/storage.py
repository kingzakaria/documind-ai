"""
Cloud file storage via an S3-compatible provider (Backblaze B2).

Uploaded PDFs get moved here permanently instead of staying on local disk —
local disk on most hosting platforms gets wiped on every redeploy, so this
is what makes an uploaded document survive beyond your own machine.
"""

import os
import logging
import socket
from urllib.parse import urlparse

import requests
import boto3
from botocore.config import Config

BUCKET_NAME = os.getenv("R2_BUCKET_NAME")

logger = logging.getLogger(__name__)


def get_r2_client(addressing_style: str = "virtual"):
    """Create an S3 client using the requested addressing style (virtual or path)."""
    return boto3.client(
        "s3",
        endpoint_url=os.getenv("R2_ENDPOINT_URL"),
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        config=Config(signature_version="s3v4", s3={"addressing_style": addressing_style}),
    )


def upload_document_file(local_path: str, doc_id: str) -> str:
    """
    Uses a single put_object call (reads the whole file into memory and
    sends it in one request) instead of boto3's upload_file(), which uses
    a multi-threaded transfer manager that can be flaky on some Python
    versions/networks. Files here are capped at 15MB, so there's no real
    need for multipart/chunked upload complexity.
    """
    # Log helpful environment diagnostics (don't print secrets)
    logger.debug("R2 endpoint present: %s", bool(os.getenv("R2_ENDPOINT_URL")))
    logger.debug("R2 bucket present: %s", bool(BUCKET_NAME))
    logger.debug("HTTP_PROXY present: %s", bool(os.getenv("HTTP_PROXY") or os.getenv("http_proxy")))
    logger.debug("HTTPS_PROXY present: %s", bool(os.getenv("HTTPS_PROXY") or os.getenv("https_proxy")))

    # Probe the endpoint with a simple HTTP GET to gather diagnostics
    endpoint = os.getenv("R2_ENDPOINT_URL")
    if endpoint:
        try:
            logger.info("Probing R2 endpoint: %s", endpoint)
            resp = requests.get(endpoint, timeout=5)
            logger.info("Endpoint probe: status=%s headers=%s", resp.status_code, dict(resp.headers))
        except Exception as e:
            logger.warning("Endpoint probe failed: %s", e)

        # DNS resolution info
        try:
            parsed = urlparse(endpoint)
            host = parsed.netloc.split("@")[-1]
            addrs = socket.getaddrinfo(host, None)
            logger.info("DNS resolution for %s: %s", host, [a[4][0] for a in addrs])
        except Exception as e:
            logger.warning("DNS resolution failed for %s: %s", endpoint, e)

    key = f"{doc_id}.pdf"
    with open(local_path, "rb") as f:
        file_bytes = f.read()

    # Try virtual addressing first, then fall back to path addressing.
    last_exc = None
    for style in ("virtual", "path"):
        client = get_r2_client(addressing_style=style)
        try:
            logger.info("Attempting S3 put_object with addressing_style=%s", style)
            client.put_object(Bucket=BUCKET_NAME, Key=key, Body=file_bytes, ContentType="application/pdf")
            logger.info("S3 upload succeeded with addressing_style=%s", style)
            return key
        except Exception as e:
            last_exc = e
            logger.warning("S3 upload attempt failed with addressing_style=%s: %s", style, e)

    # All attempts failed — log endpoint/bucket/key and raise the last exception
    logger.exception(
        "S3 upload failed (all addressing styles): endpoint=%s bucket=%s key=%s",
        os.getenv("R2_ENDPOINT_URL"),
        BUCKET_NAME,
        key,
    )
    raise last_exc


def delete_document_file(doc_id: str) -> None:
    client = get_r2_client()
    key = f"{doc_id}.pdf"
    try:
        client.delete_object(Bucket=BUCKET_NAME, Key=key)
    except Exception:
        pass  # already gone is fine — deletion should never crash the request