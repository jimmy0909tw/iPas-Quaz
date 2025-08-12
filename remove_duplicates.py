import csv

# 你可以改成自己檔案的路徑
files = ["questions.csv", "questions2.csv"]
unique_questions = {}
header = None

for filename in files:
    with open(filename, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        if header is None:
            header = next(reader)
        else:
            next(reader)
        for row in reader:
            question = row[0]  # 假設題目在第一欄
            if question not in unique_questions:
                unique_questions[question] = row

with open("questions_dedup.csv", "w", newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(header)
    for row in unique_questions.values():
        writer.writerow(row)

print("已完成去重，結果存成 questions_dedup.csv")
