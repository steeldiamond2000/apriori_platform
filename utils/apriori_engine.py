import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
import numpy as np

def run_apriori(filepath, min_support=0.05, min_confidence=0.2, max_rules=100):
    """
    Reads a CSV file, preprocesses the data, and runs the Apriori algorithm.
    """
    try:
        # Attempt to read CSV with various encodings
        try:
            df = pd.read_csv(filepath)
        except UnicodeDecodeError:
            df = pd.read_csv(filepath, encoding='latin1')

        # Convert to transaction format
        # If dataset is already boolean or 0/1, we could handle it differently,
        # but the safest generic way for "market basket" type data is to treat
        # each row as a transaction, and the non-null values as items.
        
        # Check if the dataset is already purely numeric/boolean (one-hot encoded)
        is_numeric = all(pd.api.types.is_numeric_dtype(df[col]) or pd.api.types.is_bool_dtype(df[col]) for col in df.columns)
        
        if is_numeric and set(pd.unique(df.values.ravel())).issubset({0, 1, 0.0, 1.0, True, False, np.nan}):
            # Already one-hot encoded
            df = df.fillna(0).astype(bool)
            encoded_df = df
        else:
            # Convert rows to list of items
            transactions = []
            for i in range(len(df)):
                # Drop NA values and convert to string to treat as items
                row = df.iloc[i].dropna().astype(str).tolist()
                # Optionally prefix with column name to distinguish same values in diff columns
                # row = [f"{df.columns[j]}_{val}" for j, val in enumerate(df.iloc[i]) if pd.notna(val)]
                if row:
                    transactions.append(row)
            
            if not transactions:
                raise ValueError("No valid transactions found in the dataset.")
            
            te = TransactionEncoder()
            te_ary = te.fit(transactions).transform(transactions)
            encoded_df = pd.DataFrame(te_ary, columns=te.columns_)

        # Run Apriori
        frequent_itemsets = apriori(encoded_df, min_support=min_support, use_colnames=True)
        
        if frequent_itemsets.empty:
            return {
                "rules": [],
                "frequent_itemsets_count": 0,
                "total_rules": 0
            }

        # Generate Rules
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence, num_itemsets=2)
        
        if rules.empty:
            return {
                "rules": [],
                "frequent_itemsets_count": len(frequent_itemsets),
                "total_rules": 0
            }

        # Sort by confidence descending
        rules = rules.sort_values(by='confidence', ascending=False)
        
        # Limit to max_rules
        rules = rules.head(max_rules)

        # Format rules for JSON serialization
        formatted_rules = []
        for _, row in rules.iterrows():
            formatted_rules.append({
                "antecedents": list(row['antecedents']),
                "consequents": list(row['consequents']),
                "support": round(row['support'], 4),
                "confidence": round(row['confidence'], 4),
                "lift": round(row['lift'], 4)
            })

        return {
            "rules": formatted_rules,
            "frequent_itemsets_count": len(frequent_itemsets),
            "total_rules": len(rules)
        }

    except Exception as e:
        raise Exception(f"Error during Apriori processing: {str(e)}")
