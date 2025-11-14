"use client";

/**
 * Price Calculator Component
 * Calculates selling price based on cost and margin percentage
 */
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceCalculatorProps {
  cost: number;
  margin: number;
  onCostChange: (cost: number) => void;
  onMarginChange: (margin: number) => void;
  onSellingPriceChange: (price: number) => void;
}

export function PriceCalculator({
  cost: initialCost,
  margin: initialMargin,
  onCostChange,
  onMarginChange,
  onSellingPriceChange,
}: PriceCalculatorProps) {
  const [cost, setCost] = useState(initialCost.toString());

  const calculatePrice = () => {
    const costNum = parseFloat(cost) || 0;
    const marginNum = initialMargin || 0;
    if (costNum <= 0 || marginNum < 0) return 0;
    const price = costNum * (1 + marginNum / 100);
    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(price * 100) / 100;
  };

  const calculatedPrice = calculatePrice();

  useEffect(() => {
    const costNum = parseFloat(cost) || 0;
    onCostChange(costNum);
    const price = calculatePrice();
    // Round to 2 decimal places to avoid floating point precision issues
    const roundedPrice = Math.round(price * 100) / 100;
    onSellingPriceChange(roundedPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cost, initialMargin]);

  return (
    <Card className="border-2 border-primary/50 shadow-lg">
      <CardHeader className="border-b-2 border-primary/50 bg-primary/5">
        <CardTitle className="text-primary">Price Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cost">Cost (USD)</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin">Margin (%)</Label>
          <Input
            id="margin"
            type="number"
            step="0.1"
            min="0"
            max="1000"
            value={initialMargin}
            onChange={(e) => {
              const marginValue = parseFloat(e.target.value) || 0;
              onMarginChange(marginValue);
            }}
            placeholder="0.0"
          />
        </div>

        <div className="rounded-lg border bg-muted p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selling Price:</span>
            <span className="text-2xl font-bold">
              ${calculatedPrice.toFixed(2)} USD
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Margin: ${(calculatedPrice - (parseFloat(cost) || 0)).toFixed(2)} USD
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
