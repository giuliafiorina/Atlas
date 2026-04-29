"use client";

import { categoryStyles, type TravelCategory } from "@/data/journals";

type CategoryFilterProps = {
  categories: TravelCategory[];
  selectedCategory: TravelCategory | "All";
  onSelectCategory: (category: TravelCategory | "All") => void;
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3" aria-label="Filter journals by category">
      <button
        type="button"
        onClick={() => onSelectCategory("All")}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
          selectedCategory === "All"
            ? "border-moss bg-moss text-paper"
            : "border-ink/15 bg-paper text-ink/70 hover:border-moss hover:text-moss"
        }`}
      >
        All
      </button>
      {categories.map((category) => {
        const isSelected = selectedCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isSelected
                ? "border-moss bg-moss text-paper"
                : `${categoryStyles[category]} hover:border-moss`
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
