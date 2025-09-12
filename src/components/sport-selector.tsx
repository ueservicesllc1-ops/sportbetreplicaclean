'use client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { apiSports } from "@/lib/odds-api";
  
interface SportSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function SportSelector({ value, onChange }: SportSelectorProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full md:w-[280px] mb-4">
                <SelectValue placeholder="Selecciona un deporte" />
            </SelectTrigger>
            <SelectContent>
                {apiSports.map(sport => (
                    <SelectItem key={sport.key} value={sport.key}>
                        {sport.title}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
