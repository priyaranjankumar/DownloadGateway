"""Safe async subprocess runner with command allowlist."""

from __future__ import annotations

import asyncio
from typing import NamedTuple

import structlog

log = structlog.get_logger(__name__)

# Only these executables may be invoked.  Values are absolute paths so we never
# rely on $PATH inside the subprocess.
ALLOWED_COMMANDS: dict[str, str] = {
    "wg-quick": "/usr/bin/wg-quick",
    "wg": "/usr/bin/wg",
    "iptables": "/usr/sbin/iptables",
    "iptables-save": "/usr/sbin/iptables-save",
    "journalctl": "/usr/bin/journalctl",
    "resolvconf": "/usr/sbin/resolvconf",
    "ip": "/usr/sbin/ip",
    "cp": "/usr/bin/cp",
    "rm": "/usr/bin/rm",
}

SUDO = "/usr/bin/sudo"


class CommandResult(NamedTuple):
    """Wrapper for the three-tuple returned by every invocation."""

    stdout: str
    stderr: str
    returncode: int


async def run_command(
    cmd: str,
    *args: str,
    timeout: int = 30,
    check: bool = True,
    sudo: bool = False,
) -> CommandResult:
    """Run an allow-listed command asynchronously.

    Parameters
    ----------
    cmd:
        Logical command name (must exist in ``ALLOWED_COMMANDS``).
    args:
        Positional arguments forwarded to the executable.
    timeout:
        Maximum wall-clock seconds before the process is killed.
    check:
        If *True*, raise ``RuntimeError`` when the exit code is non-zero.
    sudo:
        Prepend ``/usr/bin/sudo`` to the invocation.

    Returns
    -------
    CommandResult
        ``(stdout, stderr, returncode)`` named-tuple.

    Raises
    ------
    ValueError
        If *cmd* is not in the allowlist.
    RuntimeError
        If *check* is True and the command returns a non-zero exit code.
    asyncio.TimeoutError
        If the command exceeds *timeout* seconds.
    """
    exe = ALLOWED_COMMANDS.get(cmd)
    if exe is None:
        raise ValueError(f"Command {cmd!r} is not in the allowlist")

    argv: list[str] = []
    if sudo:
        argv.append(SUDO)
    argv.append(exe)
    argv.extend(args)

    log.debug("subprocess_start", argv=argv)

    proc = await asyncio.create_subprocess_exec(
        *argv,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        raw_out, raw_err = await asyncio.wait_for(
            proc.communicate(), timeout=timeout
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        log.error("subprocess_timeout", argv=argv, timeout=timeout)
        raise

    stdout = raw_out.decode(errors="replace")
    stderr = raw_err.decode(errors="replace")
    returncode = proc.returncode or 0

    log.debug(
        "subprocess_done",
        argv=argv,
        returncode=returncode,
        stdout_len=len(stdout),
        stderr_len=len(stderr),
    )

    if check and returncode != 0:
        raise RuntimeError(
            f"Command {argv!r} failed (rc={returncode}): {stderr.strip()}"
        )

    return CommandResult(stdout, stderr, returncode)
