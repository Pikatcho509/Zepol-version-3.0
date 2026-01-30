
filename = 'script.js'
with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            balance += 1
        elif char == '}':
            balance -= 1
            if balance < 0:
                print(f"Error: Unexpected closing brace at line {i+1}")
                exit()

if balance != 0:
    print(f"Error: Unbalanced braces. Final balance: {balance} (Positive means missing closing brace)")
else:
    print("Braces are balanced.")
