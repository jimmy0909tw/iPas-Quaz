import pandas as pd

# 讀取 questions.csv
df = pd.read_csv('questions.csv', header=None, names=['id', 'question', 'opt1', 'opt2', 'opt3', 'opt4', 'answer', 'explanation'])

# 依據 question 欄去除重複，只保留第一個出現的
df_unique = df.drop_duplicates(subset=['question'])

# 輸出新的 CSV 檔案
df_unique.to_csv('questions_unique.csv', index=False, header=False)

print("已去除重複題目，檔案輸出為 questions_unique.csv")
