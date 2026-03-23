import os
import sys
import time
import signal
import subprocess

# Bypass Ollama parser bugs and prevent browser popups
os.environ["OPENAI_API_BASE"] = "http://localhost:11434/v1"
os.environ["OPENAI_API_KEY"] = "ollama"
os.environ["OLLAMA_API_BASE"] = "http://localhost:11434"

VISION_FILE = "docs/VISION.md"
ROADMAP_FILE = "docs/ROADMAP.md"
SPRINT_FILE = "docs/SPRINT.md"
ERROR_LOG_FILE = "docs/ERRORS.md"

# --- CONFIGURATION ---
TEST_COMMAND = ["npm", "run", "build"] 
MAX_QA_RETRIES = 3

# --- STATE TRACKERS ---
last_vision_mtime = 0
night_shift_completed = False
factory_blocked = False
shutdown_requested = False # New state for graceful exits

# ==========================================
# SIGNAL HANDLER (GRACEFUL SHUTDOWN)
# ==========================================
def handle_sigint(sig, frame):
    global shutdown_requested
    if shutdown_requested:
        print("\n🚨 [FORCE KILL] Second Ctrl+C detected. Terminating immediately! Your repo may be dirty.")
        sys.exit(1)
    else:
        print("\n🛑 [SHUTDOWN INITIATED]")
        print("   The CEO has received the stop signal.")
        print("   It will finish the current micro-task, commit to Git, and exit cleanly.")
        print("   (Press Ctrl+C again if you need to force quit immediately)")
        shutdown_requested = True

# Register the signal handler
signal.signal(signal.SIGINT, handle_sigint)

def pre_flight_check():
    """Ensures the git working directory is clean to protect human code."""
    print("🛫 Running Pre-Flight Check...")
    try:
        result = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
        if result.stdout.strip():
            print("\n🛑 [PRE-FLIGHT FAILED] Uncommitted changes detected!")
            print("   The AI factory uses `git reset --hard` to rollback failed code.")
            print("   If it runs now, it WILL permanently delete your unsaved daytime work.")
            print("   Action Required: Please `git commit` your code before handing off to the CEO.")
            sys.exit(1)
        else:
            print("✅ [PRE-FLIGHT PASSED] Git tree is clean. Handing off to AI.")
    except Exception as e:
        print(f"\n⚠️ [PRE-FLIGHT WARNING] Could not verify git status: {e}")

def log_error(context, error_details):
    """Appends a timestamped error message to the ERRORS.md file."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted_error = f"- **[{timestamp}] {context}:** `{error_details}`\n"
    print(f"\n🚨 {context}: {error_details}")
    try:
        os.makedirs(os.path.dirname(ERROR_LOG_FILE), exist_ok=True)
        with open(ERROR_LOG_FILE, "a") as f:
            f.write(formatted_error)
    except Exception as e:
        print(f"\n⚠️ CRITICAL: Could not write to {ERROR_LOG_FILE}. Error: {e}")

def run_aider(model, message, read_files=None, edit_files=None):
    """Safely constructs the Aider command with explicit read and edit permissions."""
    read_files = read_files or []
    edit_files = edit_files or []
    
    cmd = ["python3", "-m", "aider", "--yes", "--exit", "--no-show-model-warnings", "--no-auto-commits", "--message", message]
    
    if model == "execution_cluster":
        cmd.extend(["--model", "openai/qwen2.5-coder:14b"])
    else:
        cmd.extend(["--model", f"openai/{model}"])
        
    for f in read_files:
        cmd.extend(["--read", f])
        
    for f in edit_files:
        cmd.append(f)
            
    print(f"\n🚀 Launching Aider with {model}...")
    try:
        subprocess.run(cmd, timeout=1800)
    except subprocess.TimeoutExpired as e:
        log_error("Aider Timeout", f"Process hung for 30+ mins on model {model}. Command: {' '.join(cmd)}")

def commit_to_git(task_name):
    """Stages all changes and creates an atomic commit using the sprint task name."""
    try:
        clean_task_name = task_name.replace("- [ ]", "").strip()
        commit_msg = f"Auto-commit: {clean_task_name}"
        
        subprocess.run(["git", "add", "."], capture_output=True)
        result = subprocess.run(["git", "commit", "-m", commit_msg], capture_output=True, text=True)
        
        if "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
            print("\n[GIT] No changes detected. Skipping commit.")
        else:
            print(f"\n[GIT] Successfully committed: '{commit_msg}'")
    except Exception as e:
        log_error("Git Commit Failed", str(e))

def check_sprint_has_tasks():
    try:
        if not os.path.exists(SPRINT_FILE): return False
        with open(SPRINT_FILE, 'r') as f:
            return "[ ]" in f.read()
    except Exception as e:
        log_error("File Read Error", f"Failed to check {SPRINT_FILE}: {e}")
        return False

def check_roadmap_has_tasks():
    try:
        if not os.path.exists(ROADMAP_FILE): return False
        with open(ROADMAP_FILE, 'r') as f:
            return "[ ]" in f.read()
    except Exception as e:
        log_error("File Read Error", f"Failed to check {ROADMAP_FILE}: {e}")
        return False

# ==========================================
# BOOT SEQUENCE
# ==========================================
pre_flight_check()
print("\n🤖 CEO Agent started. Watching docs/VISION.md for saves...")
print("💡 Tip: Press Ctrl+C at any time to request a clean, graceful shutdown.")

while True:
    try:
        # Check if user requested a shutdown during the sleep cycle or between tasks
        if shutdown_requested:
            print("\n🏁 Factory shutdown complete. The codebase is clean and ready for manual override.")
            break

        if os.path.exists(VISION_FILE):
            current_vision_mtime = os.path.getmtime(VISION_FILE)
        else:
            current_vision_mtime = last_vision_mtime
            
        if last_vision_mtime == 0:
            last_vision_mtime = current_vision_mtime
            
        # TRIGGER 1: THE BRAIN DUMP
        if current_vision_mtime > last_vision_mtime:
            print("\n[VISION UPDATED] Extracting new concepts into Architecture...")
            factory_blocked = False 
            
            arch_prompt = """
            Analyze the VISION.md file. Update ARCHITECTURE.md with any new technical requirements, data models, or stack choices mentioned.
            Do not remove existing architecture unless it directly contradicts the new vision. DO NOT write app code.
            """
            run_aider("qwen3.5:27b", arch_prompt, read_files=[VISION_FILE], edit_files=["docs/ARCHITECTURE.md"])
            
            print("\n[ARCHITECTURE UPDATED] Appending to Master Roadmap...")
            roadmap_prompt = """
            Compare ARCHITECTURE.md with ROADMAP.md. Identify any newly added features.
            APPEND these new features to the bottom of ROADMAP.md as unchecked tasks '- [ ]'.
            CRITICAL RULE: DO NOT modify, delete, or uncheck any existing tasks in ROADMAP.md. ROADMAP.md is our permanent historical ledger. DO NOT write app code.
            """
            run_aider("execution_cluster", roadmap_prompt, read_files=["docs/ARCHITECTURE.md"], edit_files=[ROADMAP_FILE])
            
            last_vision_mtime = current_vision_mtime
            night_shift_completed = False 
            continue 
            
        if factory_blocked:
            time.sleep(10)
            continue

        # TRIGGER 2: THE TECH LEAD
        if not check_sprint_has_tasks() and check_roadmap_has_tasks():
            print("\n[SPRINT EMPTY] Tech Lead is extrapolating next feature into Sprint tasks...")
            
            target_feature = ""
            target_line_idx = -1
            
            # 1. READ the roadmap and identify the target without mutating it yet
            with open(ROADMAP_FILE, 'r') as f:
                lines = f.readlines()
                
            for idx, line in enumerate(lines):
                # Just look for "[ ]" to ensure it matches what check_roadmap_has_tasks() saw
                if "[ ]" in line:
                    # Extract whatever text comes AFTER the checkbox
                    extracted = line.split("[ ]", 1)[-1].strip()
                    if extracted:
                        target_feature = extracted
                        target_line_idx = idx
                        break
                    else:
                        # Auto-clear blank/ghost tasks so we don't get stuck on them
                        lines[idx] = line.replace("[ ]", "[x]", 1)

            # If we didn't find a valid feature (e.g., we just cleared empty checkboxes)
            if target_feature == "":
                with open(ROADMAP_FILE, 'w') as f:
                    f.writelines(lines)
                print("[INFO] Cleaned up empty/invalid checkboxes in roadmap.")
                time.sleep(5) # Give the loop a breather before restarting
                continue
                    
            print(f"Target Feature: {target_feature}")
            
            planner_prompt = f"""
            Act as a Senior Tech Lead. We are building the following feature: "{target_feature}"
            1. Extrapolate this single feature into a checklist of 3 to 5 highly specific, granular coding micro-tasks.
            2. Write these micro-tasks into SPRINT.md as an unchecked list '- [ ]'.
            DO NOT write application code.
            CRITICAL: Do not ask for clarification or acknowledge this message. Output the tasks directly to the file immediately.
            """
            run_aider("execution_cluster", planner_prompt, read_files=["docs/ARCHITECTURE.md", ROADMAP_FILE], edit_files=[SPRINT_FILE])
            
            # 2. VERIFY the LLM actually did its job before updating the roadmap
            if check_sprint_has_tasks():
                print(f"\n[SUCCESS] Tasks generated for: {target_feature}")
                # Now it is safe to check off the roadmap item
                lines[target_line_idx] = lines[target_line_idx].replace("[ ]", "[x]", 1)
                
                with open(ROADMAP_FILE, 'w') as f:
                    f.writelines(lines)
                    
                commit_to_git(f"Roadmap -> Sprint: {target_feature}")
            else:
                print("\n[TECH LEAD FAILED] AI failed to generate sprint tasks. Keeping task on roadmap and retrying...")
                time.sleep(5) # Prevent aggressive retry spam
                
            continue
            
        # TRIGGER 3: THE CODER
        if check_sprint_has_tasks():
            print("\n[EXECUTING] Writing code for top Sprint item...")
            
            with open(SPRINT_FILE, 'r') as f:
                lines = f.readlines()
                current_task = next((line for line in lines if "[ ]" in line), "Unknown Task")
            
            print(f"Task: {current_task.strip()}")
            
            coder_prompt = """
            Look at the first unchecked task '- [ ]' in SPRINT.md.
            Write the application code to implement ONLY that specific task.
            Use your repository map to find the correct files to edit. 
            DO NOT edit SPRINT.md or any documentation files. Just write the code for the app.
            """
            run_aider("execution_cluster", coder_prompt, read_files=["docs/ARCHITECTURE.md", SPRINT_FILE])
            
            # --- QA VERIFICATION LOOP ---
            build_passed = False
            for attempt in range(MAX_QA_RETRIES):
                # If shutdown was requested mid-QA, don't keep looping
                if shutdown_requested and attempt > 0:
                    print("\n🛑 Skipping further QA retries due to shutdown request.")
                    break

                print(f"\n[QA] Running verification test (Attempt {attempt + 1}/{MAX_QA_RETRIES})...")
                qa_process = subprocess.run(TEST_COMMAND, capture_output=True, text=True)
                
                if qa_process.returncode == 0:
                    print("\n[QA] Build passed! 🟢")
                    build_passed = True
                    break
                else:
                    error_output = qa_process.stderr if qa_process.stderr else qa_process.stdout
                    truncated_error = error_output[-2000:] 
                    
                    print(f"\n[QA] Build failed! 🔴 Feeding error back to AI...")
                    
                    if attempt == MAX_QA_RETRIES - 1:
                        break 
                        
                    qa_prompt = f"""
                    You just wrote code for the task: "{current_task.strip()}".
                    However, the verification test ({' '.join(TEST_COMMAND)}) failed with this error:
                    
                    ```text
                    {truncated_error}
                    ```
                    
                    Fix the code so the build passes. DO NOT edit documentation.
                    """
                    run_aider("execution_cluster", qa_prompt, read_files=["docs/ARCHITECTURE.md", SPRINT_FILE])

            if build_passed:
                print("\n[CLEANUP] Removing completed task from SPRINT.md...")
                with open(SPRINT_FILE, "w") as f:
                    task_deleted = False
                    for line in lines:
                        if "[ ]" in line and not task_deleted:
                            task_deleted = True 
                            continue
                        f.write(line)
                
                commit_to_git(current_task)
            else:
                print("\n[QA FATAL] AI failed to fix the code. Reverting codebase to last known good state...")
                log_error("QA Build Failed", f"Task '{current_task.strip()}' broke the build. Reverted.")
                
                subprocess.run(["git", "reset", "--hard"], capture_output=True)
                subprocess.run(["git", "clean", "-fd"], capture_output=True)
                
                print("\n🚨 SYSTEM BLOCKED. Task remains in SPRINT.md. Update VISION.md to unblock factory.")
                factory_blocked = True
                
            continue
                    
        # TRIGGER 4: THE NIGHT SHIFT
        if not check_sprint_has_tasks() and not check_roadmap_has_tasks() and not night_shift_completed:
            print("\n[NIGHT SHIFT] Factory is idle. Initiating deep codebase cleanup...")
            cleanup_prompt = """
            The active sprint is complete. Act as a Senior Staff Engineer doing a codebase audit.
            1. Look at the code files in the repository. Add professional JSDoc comments to functions that lack them.
            2. Ensure ARCHITECTURE.md perfectly reflects the current reality of the codebase. Update it if necessary.
            3. Ensure file structures and imports are clean.
            CRITICAL: Do NOT change any existing business logic or break working routes. Only format, comment, and document.
            """
            run_aider("execution_cluster", cleanup_prompt, read_files=[ROADMAP_FILE], edit_files=["docs/ARCHITECTURE.md"])
            
            commit_to_git("Night Shift Codebase Cleanup and JSDoc alignment")
            
            night_shift_completed = True
            print("\n[SYSTEM IDLE] Night shift complete. Waiting for new instructions in VISION.md...")
            continue
            
    except Exception as e:
        log_error("Orchestrator Core Loop Crashed", str(e))
    
    # We check shutdown requested here as well, so if you hit Ctrl+C during the sleep, it exits instantly
    if shutdown_requested:
        print("\n🏁 Factory shutdown complete. The codebase is clean and ready for manual override.")
        break

    time.sleep(10)