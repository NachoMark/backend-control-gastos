// src/utils/format.ts

export const formatCurrency = (amount: number | string) => {
    // Convertimos a número por si viene como texto
    const num = Number(amount);
    
    // Si no es un número válido, devolvemos $0.00
    if (isNaN(num)) return '$0,00';

    // Usamos el formateador de JavaScript
    // 'es-AR' usa puntos para miles y coma para decimales (1.000,00)
    return num.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};