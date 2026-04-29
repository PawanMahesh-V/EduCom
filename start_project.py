import subprocess
import os
import sys
import time
import signal
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False
    # Define dummy classes if colorama is missing
    class Fore: CYAN = GREEN = RED = YELLOW = ""
    class Style: RESET_ALL = BRIGHT = ""

class ProjectRunner:
    def __init__(self):
        self.processes = []
        self.root_dir = os.path.dirname(os.path.abspath(__file__))

    def log(self, service, message, color=Fore.CYAN):
        print(f"{color}[{service}]{Style.RESET_ALL} {message}")

    def run_service(self, name, cwd, command):
        self.log(name, f"Starting in {cwd}...")
        full_cwd = os.path.join(self.root_dir, cwd)
        
        try:
            # shell=True is needed for 'npm' on Windows
            process = subprocess.Popen(
                command,
                cwd=full_cwd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            self.processes.append((name, process))
            return process
        except Exception as e:
            self.log(name, f"Failed to start: {e}", Fore.RED)
            return None

    def monitor_output(self, name, process):
        """Simple non-blocking check for process output"""
        # Note: In a real CLI this would be in threads, 
        # but for a simple start script, we'll just check if it's still alive
        if process.poll() is not None:
            self.log(name, f"Process exited with code {process.returncode}", Fore.RED)
            return False
        return True

    def start_all(self):
        print(f"\n{Fore.GREEN}{Style.BRIGHT}🚀 Starting EduCom Full-Stack Project...{Style.RESET_ALL}\n")
        
        # 1. Backend
        self.run_service("Backend", "backend", "npm run dev")
        time.sleep(2) # Give backend a moment
        
        # 2. ML Service
        self.run_service("ML-Service", "ml-service", "python main.py")
        time.sleep(2)
        
        # 3. Frontend
        self.run_service("Frontend", "frontend", "npm run dev")
        
        print(f"\n{Fore.GREEN}{Style.BRIGHT}✅ All services are launching!{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Press Ctrl+C to stop all services.{Style.RESET_ALL}\n")

        try:
            while True:
                all_alive = True
                for name, proc in self.processes:
                    if proc.poll() is not None:
                        self.log(name, f"Stopped unexpectedly!", Fore.RED)
                        all_alive = False
                
                if not all_alive:
                    break
                time.sleep(5)
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}🛑 Stopping all services...{Style.RESET_ALL}")
            self.stop_all()

    def stop_all(self):
        for name, proc in self.processes:
            self.log(name, "Killing process...")
            if os.name == 'nt':
                # Windows specific kill (taskkill /T /F /PID) to kill child processes too (like node)
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)], capture_output=True)
            else:
                proc.terminate()
        print(f"{Fore.GREEN}Done. All services stopped.{Style.RESET_ALL}")

if __name__ == "__main__":
    runner = ProjectRunner()
    runner.start_all()
