import csv
from apyori import apriori


def run_apriori(filepath, min_support=0.05, min_confidence=0.2, max_rules=100):

    transactions = []

    try:
        with open(filepath, 'r', encoding='utf-8') as file:

            reader = csv.reader(file)

            next(reader, None)

            for row in reader:

                if len(row) < 2:
                    continue

                items = row[1].split(',')

                cleaned_items = [item.strip() for item in items if item.strip()]

                if cleaned_items:
                    transactions.append(cleaned_items)

        association_results = apriori(
            transactions,
            min_support=min_support,
            min_confidence=min_confidence
        )

        formatted_rules = []

        for item in association_results:

            for stat in item.ordered_statistics:

                antecedent = list(stat.items_base)
                consequent = list(stat.items_add)

                if antecedent and consequent:

                    formatted_rules.append({
                        "antecedents": antecedent,
                        "consequents": consequent,
                        "support": round(item.support, 4),
                        "confidence": round(stat.confidence, 4),
                        "lift": round(stat.lift, 4)
                    })

        formatted_rules = sorted(
            formatted_rules,
            key=lambda x: x['confidence'],
            reverse=True
        )

        formatted_rules = formatted_rules[:max_rules]

        return {
            "rules": formatted_rules,
            "frequent_itemsets_count": len(formatted_rules),
            "total_rules": len(formatted_rules)
        }

    except Exception as e:
        raise Exception(f"Error during Apriori processing: {str(e)}")
