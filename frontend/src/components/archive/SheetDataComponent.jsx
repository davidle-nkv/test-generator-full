import { useEffect, useState } from 'react';

const SHEET_CSV_URL = 'https://drive.google.com/file/d/10qUYUGP2Q211tq4fAobfMKd7Jz4QA62f/view?usp=drive_link';

export default function SheetDataComponent() {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetch(SHEET_CSV_URL)
            .then(response => response.text())
            .then(csvText => {
                // Parse the CSV text into an array of objects
                const rows = csvText.split('\n').map(row => row.split(','));
                const headers = rows[0];
                const parsedData = rows.slice(1).map(row => {
                    return headers.reduce((acc, header, i) => {
                        acc[header.trim()] = row[i]?.trim();
                        return acc;
                    }, {});
                });
                setData(parsedData);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    return (
        <div>
            <h1>Sheet Data</h1>
            {data.length > 0 ? (
                <ul>
                    {data.map((item, index) => (
                        <li key={index}>Name: {item.Name}, Email: {item.Email}</li>
                    ))}
                </ul>
            ) : (
                <p>Loading data...</p>
            )}
        </div>
    );
}