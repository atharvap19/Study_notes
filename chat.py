import os, sys
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("backend/.env")
load_dotenv("auth-system/backend/.env")

API_KEY  = os.environ.get("GROQ_API_KEY")
BASE_URL = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
MODEL    = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

if not API_KEY:
    print("Error: GROQ_API_KEY not set. Add it to backend/.env")
    sys.exit(1)

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
history = []

RESET  = "\033[0m"
BOLD   = "\033[1m"
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
DIM    = "\033[2m"

def stream_response(messages):
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=8192,
        stream=True,
    )
    full = []
    print(f"\n{GREEN}{BOLD}Groq:{RESET} ", end="", flush=True)
    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            print(delta, end="", flush=True)
            full.append(delta)
    print("\n")
    return "".join(full)

def main():
    print(f"\n{CYAN}{BOLD}╔══════════════════════════════════════╗")
    print(f"║   DeepSeek V4 Pro — Terminal Chat    ║")
    print(f"╚══════════════════════════════════════╝{RESET}")
    print(f"{DIM}Model : {MODEL}")
    print(f"Type  : 'exit' or Ctrl+C to quit")
    print(f"Type  : 'clear' to reset conversation{RESET}\n")

    while True:
        try:
            user_input = input(f"{YELLOW}{BOLD}You:{RESET} ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{DIM}Bye!{RESET}")
            sys.exit(0)

        if not user_input:
            continue
        if user_input.lower() == "exit":
            print(f"{DIM}Bye!{RESET}")
            break
        if user_input.lower() == "clear":
            history.clear()
            print(f"{DIM}Conversation cleared.{RESET}\n")
            continue

        history.append({"role": "user", "content": user_input})
        reply = stream_response(history)
        history.append({"role": "assistant", "content": reply})

if __name__ == "__main__":
    main()
