import socket
import re
import os

def get_local_ip():
    """Gets the active local IPv4 address of the machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Connects to a dummy external address to force the OS to pick an active local IP
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def update_ip_in_files(new_ip):
    """Searches for React Native frontend files and replaces the old API IP with the new one."""
    # This regex looks for 'http://<any-ip-address>:5004'
    ip_pattern = re.compile(r'http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:5004')
    replacement = f'http://{new_ip}:5004'
    
    # We only care about the frontend folders where the API URL is defined
    directories_to_search = ['app', 'contexts']
    updated_files = []

    for directory in directories_to_search:
        if not os.path.exists(directory):
            continue
            
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith(('.ts', '.tsx')):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # If the file contains an IP address pointing to port 5004, replace it!
                    if ip_pattern.search(content):
                        # Avoid replacing if it's already exactly the same
                        if replacement in content and not ip_pattern.sub('', content) != content:
                             # Just a small check, actually re.sub is safe even if it's the same
                             pass
                        
                        new_content = ip_pattern.sub(replacement, content)
                        
                        if new_content != content:
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            updated_files.append(filepath)
                        
    return updated_files

if __name__ == "__main__":
    current_ip = get_local_ip()
    print(f"[*] Detected active local IP: {current_ip}")
    
    updated = update_ip_in_files(current_ip)
    
    if updated:
        print(f"[*] Successfully updated IP in {len(updated)} files:")
        for f in updated:
            print(f"  -> {f}")
        print("\n[*] Done! Your app is now pointing to the correct API address.")
    else:
        print("[*] Checked all files. IP addresses are already up-to-date!")
