"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface OverviewProps {
    data: any[];
};

export const Overview: React.FC<OverviewProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `$${value}`} />
                <Bar dataKey='total' fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}  />
            </BarChart>
        </ResponsiveContainer>
    )
}
