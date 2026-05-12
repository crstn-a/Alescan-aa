import os
from dotenv import load_dotenv

# Load your local environment variables (API keys)
load_dotenv()

# Import your existing modules
from services.extractor_llamaparse import extract_with_llamaparse
from services.db import get_supabase

# =====================================================================
# STEP 1: DEFINE YOUR GROUND TRUTH (ANSWER KEY)
# Put some test PDFs in a 'test_pdfs' folder.
# Open each PDF and manually type the correct prices here.
# =====================================================================
GROUND_TRUTH = {
    "test_pdfs/sample1-scanned.pdf": {
        "whole_chicken": 192.26,
        "tilapia_local": 156.78,
        "pork_liempo": 408.60
    },
    "test_pdfs/sample2-scanned.pdf": {
        "whole_chicken": 199.05,
        "tilapia_local": 154.01,
        "pork_liempo": 381.21
    },
    "test_pdfs/sample3-scanned.pdf": {
        "whole_chicken": 198.04,
        "tilapia_local": 153.52,
        "pork_liempo": 382.37
    },
    "test_pdfs/sample4-table.pdf": {
        "whole_chicken": 191.49,
        "tilapia_local": 155.36,
        "pork_liempo": 407.82
    },
    "test_pdfs/sample5-table.pdf": {
        "whole_chicken": 191.49,
        "tilapia_local": 155.36,
        "pork_liempo": 407.82
    },
    "test_pdfs/sample6-table.pdf": {
        "whole_chicken": 192.10,
        "tilapia_local": 155.03,
        "pork_liempo": 408.45
    },
}

def evaluate_extractor():
    total_prices = 0
    correct_prices = 0

    for pdf_path, expected_data in GROUND_TRUTH.items():
        if not os.path.exists(pdf_path):
            print(f"⚠️ Skipping {pdf_path} because the file doesn't exist.")
            continue

        print(f"\nProcessing: {pdf_path}")
        try:
            # Run your actual LlamaParse extractor
            extracted_rows = extract_with_llamaparse(pdf_path)
            
            # Convert extracted list to a dictionary for easy comparison
            extracted_dict = {row["slug"]: row["price"] for row in extracted_rows}
            
            # Compare LlamaParse's output against your answer key
            for slug, expected_price in expected_data.items():
                total_prices += 1
                actual_price = extracted_dict.get(slug)
                
                if actual_price == expected_price:
                    correct_prices += 1
                    print(f"[PASS] {slug}: {actual_price}")
                else:
                    print(f"[FAIL] {slug}: Expected {expected_price}, got {actual_price}")
                    
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")
            # If it fails to process the PDF, those count as missed (total increases, correct does not)
            total_prices += len(expected_data)

    # Calculate final OCR Accuracy
    ocr_accuracy = correct_prices / total_prices if total_prices > 0 else 0
    
    print("\n" + "="*30)
    print(" EVALUATION RESULTS")
    print("="*30)
    print(f"Total Prices Checked: {total_prices}")
    print(f"Correctly Extracted:  {correct_prices}")
    print(f"OCR Accuracy:         {ocr_accuracy * 100:.2f}%")
    
    return ocr_accuracy

if __name__ == "__main__":
    print("Starting LlamaParse Evaluation...\n")
    accuracy = evaluate_extractor()

    # =====================================================================
    # STEP 2: LOG TO SUPABASE
    # Once you have tested it, we push it to the database!
    # =====================================================================
    if accuracy > 0:
        print("\nLogging results to Supabase...")
        sb = get_supabase()
        
        # Change 'LlamaParse-Test-v1' to whatever you want to name this test run
        sb.table("extractor_evaluations").insert({
            "extractor_version": "LlamaParse-Test-v1",
            "extraction_accuracy": accuracy,
            "notes": f"Offline test run on {len(GROUND_TRUTH)} real-world PDFs."
        }).execute()

        print("[OK] Results successfully logged! Refresh your Admin Dashboard to see it.")
    else:
        print("\n[WARN] Accuracy was 0 or no files were processed. Nothing logged to Supabase.")
