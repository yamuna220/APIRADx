import os

def fix_spark():
    with open('src/pages/Dashboard.tsx', 'r') as f:
        content = f.read()

    content = content.replace(
        "function Spark({ data, color, h = 36 }: { data: number[]; color: string; h?: number }) {",
        "function Spark({ data, color, h = 36 }: { data: number[]; color: string; h?: number }) {\n  if (!data || data.length === 0) return null;"
    )

    with open('src/pages/Dashboard.tsx', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_spark()
    print("Fixed Spark")
