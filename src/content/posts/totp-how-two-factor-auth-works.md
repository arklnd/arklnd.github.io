---
title: "TOTP From Scratch — How Your 2FA Code Actually Works"
description: "A deep dive into RFC 6238 Time-based One-Time Passwords: the math behind the 6-digit code, how HMAC-SHA1 produces it, and a complete Python implementation built without any TOTP library."
date: 2026-04-17
---

## How does your authenticator app generate a fresh code every 30 seconds with no network call? Pure math — and fewer than 15 lines of Python.

---

## Table of Contents

1. [Background — Why One-Time Passwords?](#1-background--why-one-time-passwords)
2. [The Standards: HOTP and TOTP](#2-the-standards-hotp-and-totp)
3. [Step 1 — The Shared Secret](#3-step-1--the-shared-secret)
4. [Step 2 — The Time Counter](#4-step-2--the-time-counter)
5. [Step 3 — HMAC-SHA1](#5-step-3--hmac-sha1)
6. [Step 4 — Dynamic Truncation](#6-step-4--dynamic-truncation)
7. [Step 5 — The Final Code](#7-step-5--the-final-code)
8. [Putting It All Together in Python](#8-putting-it-all-together-in-python)
9. [Building a Terminal Authenticator](#9-building-a-terminal-authenticator)
10. [Security Considerations](#10-security-considerations)
11. [Takeaways](#11-takeaways)

---

## 1. Background — Why One-Time Passwords?

Passwords are broken. They get phished, leaked in data breaches, brute-forced, and reused across dozens of services. The answer the industry landed on is a **second factor** — something that proves you have a physical device in addition to knowing a password.

The most common form of software-based 2FA is **TOTP**: a 6-digit code that rotates every 30 seconds. You've seen it in Google Authenticator, Authy, Bitwarden, 1Password, and countless others. You scan a QR code once, and your authenticator app produces a fresh code every half-minute, in sync with the server, without ever making a network request.

The magic is that both sides — your phone and the server — are computing the *same* code independently, from a shared secret and the current time. There's no communication, no challenge/response, just math.

That math is entirely public. It's specified in [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) and fits in fewer than 15 lines of Python.

---

## 2. The Standards: HOTP and TOTP

TOTP is built on top of an older standard — **HOTP** (HMAC-based One-Time Password, [RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226)).

HOTP generates a code from a shared secret and an incrementing **counter**. Each time you generate a code, the counter ticks up. The problem: if the client and server counters drift, codes stop working.

TOTP solves this elegantly. Instead of a persistent counter, it derives the counter from the **current Unix time**:

$$\text{counter} = \left\lfloor \frac{T_{\text{now}}}{T_{\text{step}}} \right\rfloor$$

Where $T_{\text{step}}$ is 30 seconds by default. Both sides floor the Unix timestamp to the same 30-second window and get the same counter — no synchronization needed. The only requirement is that clocks are reasonably accurate, which is trivially guaranteed by NTP.

---

## 3. Step 1 — The Shared Secret

When you scan a QR code to set up 2FA, you're importing a **shared secret** — a random byte sequence known only to you and the server. It's stored as a **Base32-encoded** string, which looks like:

```
JBSWY3DPEHPK3PXP
```

Base32 uses only uppercase letters A–Z and digits 2–7. It's URL-safe, easy to type manually, and avoids ambiguous characters.

In Python, decoding it is one line:

```python
import base64

secret = "JBSWY3DPEHPK3PXP"
secret_bytes = base64.b32decode(secret, casefold=True)
# b'Hello!\xde\xad\xbe\xef'
```

The `casefold=True` parameter accepts lowercase input too, which matters for secrets copied from apps or entered by hand.

---

## 4. Step 2 — The Time Counter

With the secret decoded, we need the counter — a 64-bit big-endian integer representing which 30-second window we're in:

```python
import time

time_step = 30
current_time = int(time.time())      # Unix timestamp in seconds
counter = current_time // time_step  # Floor divide to get the window index
counter_bytes = counter.to_bytes(8, byteorder='big')  # 8-byte big-endian
```

For example, at `2026-04-17 12:00:00 UTC` (Unix: `1776081600`):

$$\text{counter} = \left\lfloor \frac{1776081600}{30} \right\rfloor = 59202720$$

Both the server and the authenticator app perform this same calculation. As long as their clocks agree to within a few seconds, they land in the same window and produce the same code.

---

## 5. Step 3 — HMAC-SHA1

This is the cryptographic core. We compute an **HMAC-SHA1** of the counter bytes, using the shared secret as the key:

```python
import hmac
import hashlib

hmac_hash = hmac.new(secret_bytes, counter_bytes, hashlib.sha1).digest()
# 20-byte result
```

HMAC (Hash-based Message Authentication Code) takes a key and a message and produces a fixed-length tag. Unlike a raw hash, it's resistant to length-extension attacks, and its security depends on the key being secret.

SHA-1 produces 20 bytes (160 bits). While SHA-1 is broken for collision resistance (think forged certificates), that vulnerability is irrelevant here — we're not comparing hashes, we're using HMAC as a PRF (Pseudo-Random Function). HMAC-SHA1 remains cryptographically sound for this use case, which is why RFC 4226 specifies it.

The result is a 20-byte array that looks like random noise. Next, we extract a 6-digit number from it.

---

## 6. Step 4 — Dynamic Truncation

We can't use all 20 bytes — that'd be a 40-character hex code, not a 6-digit number. RFC 4226 defines **Dynamic Truncation** to extract 4 bytes from the hash in a deterministic but unpredictable way:

1. Take the **last byte** of the HMAC output.
2. Mask it with `0x0F` to get a value from 0 to 15. This is the **offset**.
3. Extract 4 bytes starting at that offset.
4. Mask the result with `0x7FFFFFFF` to clear the sign bit (ensuring a positive integer).

```python
offset = hmac_hash[-1] & 0x0F
truncated_hash = hmac_hash[offset : offset + 4]
code = int.from_bytes(truncated_hash, byteorder='big') & 0x7FFFFFFF
```

The offset is derived from the hash itself, so it varies with every counter value. This is what makes the truncation "dynamic" — an attacker observing outputs can't predict which bytes will be extracted next.

---

## 7. Step 5 — The Final Code

The last step is simple: take the 31-bit integer and produce a 6-digit code by taking it modulo $10^6$, then zero-padding to ensure exactly 6 digits:

```python
digits = 6
totp_code = str(code % (10 ** digits)).zfill(digits)
# e.g. "048271"
```

The modulo discards all but the last 6 decimal digits. `zfill(6)` pads with leading zeros so codes like `48271` become `048271` — important because `048271` and `48271` are different 6-character strings.

---

## 8. Putting It All Together in Python

Here's the complete TOTP function — no third-party library, just the Python standard library:

```python
import time
import hmac
import hashlib
import base64

def totp(secret, time_step=30, digits=6, hash_algorithm=hashlib.sha1):
    """Generates a Time-based One-Time Password (TOTP) per RFC 6238."""
    try:
        secret_bytes = base64.b32decode(secret, casefold=True)
    except base64.binascii.Error:
        raise ValueError("Invalid secret key. Must be base32 encoded.")

    current_time = int(time.time())
    counter = current_time // time_step
    counter_bytes = counter.to_bytes(8, byteorder='big')

    hmac_hash = hmac.new(secret_bytes, counter_bytes, hash_algorithm).digest()

    offset = hmac_hash[-1] & 0x0F
    truncated_hash = hmac_hash[offset : offset + 4]
    code = int.from_bytes(truncated_hash, byteorder='big') & 0x7FFFFFFF

    return str(code % (10 ** digits)).zfill(digits)
```

That's the entire algorithm. 15 lines. You can verify it produces the same output as Google Authenticator or Authy for the same secret — they all implement the same RFC.

You can also swap in `hashlib.sha256` or `hashlib.sha512` for stronger hash algorithms. Some services (like Steam) use a different number of digits or a different time step; those are just parameters.

---

## 9. Building a Terminal Authenticator

Having the `totp()` function is useful, but to make it practical you need:

- A loop that refreshes every second.
- A visual timer showing when the current code expires.
- A table of multiple accounts.

The main loop only redraws when the 30-second window changes (avoiding flicker), and `remaining_time = time_step - (current_time % time_step)` drives a progress bar that counts down to the next rotation. The table uses Unicode box-drawing characters for a clean look in any modern terminal. Here's the complete script:

Here's the full script — a self-contained terminal authenticator with no TOTP library dependency:

```python
#!/usr/bin/env python
import time
import hmac
import hashlib
import base64
import os
import shutil
from colorama import Fore, Style, init

# Initialize colorama
init()

tOTP_ART = f"""
{Fore.RED}▗ {Fore.GREEN}▄▖{Fore.YELLOW}▄▖{Fore.BLUE}▄▖{Style.RESET_ALL}
{Fore.MAGENTA}▜▘{Fore.CYAN}▌▌{Fore.RED}▐ {Fore.GREEN}▙▌{Style.RESET_ALL}
{Fore.YELLOW}▐▖{Fore.BLUE}▙▌{Fore.MAGENTA}▐ {Fore.CYAN}▌{Style.RESET_ALL}
"""

def totp(secret, time_step=30, digits=6, hash_algorithm=hashlib.sha1):
    """Generates a Time-based One-Time Password (TOTP)."""
    try:
        secret_bytes = base64.b32decode(secret, casefold=True)
    except base64.binascii.Error:
        raise ValueError("Invalid secret key. Must be base32 encoded.")

    current_time = int(time.time())
    counter = current_time // time_step
    counter_bytes = counter.to_bytes(8, byteorder='big')
    hmac_hash = hmac.new(secret_bytes, counter_bytes, hash_algorithm).digest()
    offset = hmac_hash[-1] & 0x0F
    truncated_hash = hmac_hash[offset:offset + 4]
    code = int.from_bytes(truncated_hash, byteorder='big') & 0x7FFFFFFF
    return str(code % (10 ** digits)).zfill(digits)

def print_progress_bar(remaining_time, total, length=40):
    """Prints a progress bar with remaining time."""
    progress = total - remaining_time
    percent = ("{0:.1f}").format(100 * (progress / float(total)))
    remaining_percent = ("{0:.1f}").format(100 - float(percent))
    filled_length = int(length * progress // total)
    remaining_bar = '█' * (length - filled_length) + '░' * filled_length
    print(f'{Fore.BLUE}Remaining: {remaining_bar} {remaining_percent}% {Fore.YELLOW}Time until next update: {remaining_time} seconds{Style.RESET_ALL}', end='\r')

def display_otp_table(secrets):
    """Displays the OTPs in a formatted table with ASCII borders."""
    max_service_len = max(len(secret[1]) for secret in secrets)
    service_width = min(max_service_len + 4, 34)

    top_border    = f"{Fore.BLUE}╔{'═' * (service_width + 2)}╦{'═' * 10}╗{Style.RESET_ALL}"
    header_div    = f"{Fore.BLUE}╠{'═' * (service_width + 2)}╬{'═' * 10}╣{Style.RESET_ALL}"
    row_divider   = f"{Fore.BLUE}╟{'─' * (service_width + 2)}╫{'─' * 10}╢{Style.RESET_ALL}"
    bottom_border = f"{Fore.BLUE}╚{'═' * (service_width + 2)}╩{'═' * 10}╝{Style.RESET_ALL}"

    print(f"\n{top_border}")
    print(f"{Fore.BLUE}║ {Fore.GREEN}{'SERVICE':^{service_width}} {Fore.BLUE}║ {Fore.CYAN}{'OTP':^8} {Fore.BLUE}║{Style.RESET_ALL}")
    print(header_div)

    for i, secret in enumerate(secrets):
        if i > 0:
            print(row_divider)

        service = secret[1][:service_width-2]
        otp = totp(secret[0])
        display_service = (service + '..') if len(secret[1]) > service_width-2 else service

        print(
            f"{Fore.BLUE}║ {Fore.YELLOW}{display_service:<{service_width}} {Fore.BLUE}║ "
            f"{Fore.MAGENTA}{otp:^8} {Fore.BLUE}║{Style.RESET_ALL}"
        )

    print(bottom_border)

if __name__ == "__main__":
    secrets = [
        ['JBSWY3DPEHPK3PXP', 'Gmail Personal'],
        ['MFRGGZDFMZTWQ2LK', 'Gmail Work'],
        ['GEZDGNBVGY3TQOJQ', 'ORG1'],
    ]

    time_step = 30
    last_counter = -1
    terminal_width = shutil.get_terminal_size().columns

    try:
        while True:
            current_time = int(time.time())
            current_counter = current_time // time_step

            if current_counter != last_counter:
                os.system('cls' if os.name == 'nt' else 'clear')
                print(tOTP_ART)
                display_otp_table(secrets)
                last_counter = current_counter

            remaining_time = time_step - (current_time % time_step)
            print_progress_bar(remaining_time, time_step, min(terminal_width - 20, 50))
            time.sleep(min(1, remaining_time))

    except KeyboardInterrupt:
        print(f"\n{Fore.RED}Exiting...{Style.RESET_ALL}")
```

---

## 10. Security Considerations

**Secrets are sensitive.** The Base32 secret is equivalent to your password. Anyone who obtains it can generate valid codes forever. Don't hardcode secrets in scripts you commit to version control — use a secrets manager, an encrypted store, or at minimum environment variables.

**TOTP doesn't prevent phishing.** A real-time phishing proxy can relay your code to the target site before it expires. TOTP protects against static password theft, not active relay attacks. Passkeys / FIDO2 hardware tokens solve this by binding authentication to the origin domain.

**Clock skew matters.** Most servers accept codes from the previous and next window (±30 seconds) to handle small clock differences. If your clock is off by more than a minute, codes will fail. NTP keeps this trivially in check.

---

## 11. Takeaways

TOTP is a beautiful piece of applied cryptography: simple enough to fit in 15 lines of Python, yet secure enough to protect millions of accounts. The key insight is replacing a stateful counter with a stateless time window — both sides independently compute the same value with no communication.

The algorithm in order:

| Step | Operation | Output |
|------|-----------|--------|
| 1 | Base32-decode the shared secret | Raw bytes |
| 2 | Floor-divide Unix timestamp by 30 | 64-bit counter |
| 3 | HMAC-SHA1(secret, counter) | 20-byte hash |
| 4 | Dynamic truncation (offset from last byte) | 4-byte slice |
| 5 | Mask with `0x7FFFFFFF`, mod $10^6$, zero-pad | 6-digit code |

Next time you open your authenticator app, you're looking at the output of five simple operations on a shared secret and the current time. No magic, no network call — just math.
