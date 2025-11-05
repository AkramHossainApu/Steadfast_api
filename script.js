// Parses the order confirmation message and extracts data
function parseMessage(message) {
    const lines = message.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const data = {};
    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith('নাম') || lower.startsWith('name')) {
            data.recipient_name = line.split(':').slice(1).join(':').trim();
        } else if (lower.includes('মোবাইল') || lower.includes('mobile')) {
            const parts = line.split(':');
            if (parts.length > 1) {
                data.recipient_phone = parts.slice(1).join(':').replace(/\D/g, '').trim();
            }
        } else if (lower.startsWith('ঠিকানা') || lower.includes('address')) {
            data.recipient_address = line.split(':').slice(1).join(':').trim();
        } else if (lower.startsWith('সাইজ') || lower.startsWith('size')) {
            data.size = line.split(':').slice(1).join(':').trim();
        } else if (lower.startsWith('রং') || lower.startsWith('colour') || lower.startsWith('color')) {
            data.color = line.split(':').slice(1).join(':').trim();
        } else if (lower.includes('কতগুলো') || lower.startsWith('quantity') || lower.startsWith('কতগুলো নিবেন')) {
            const match = line.match(/(\d+)/);
            if (match) {
                data.total_lot = parseInt(match[1], 10);
            }
        } else if (lower.startsWith('total') || lower.startsWith('মোট') || lower.startsWith('টোটাল')) {
            // Extract numeric value before 'tk' or last number
            const match = line.match(/([\d\.]+)\s*tk/i);
            if (match) {
                data.cod_amount = parseFloat(match[1]);
            } else {
                // fallback: take last numeric group
                const numbers = line.match(/(\d+(?:\.\d+)?)/g);
                if (numbers && numbers.length > 0) {
                    data.cod_amount = parseFloat(numbers[numbers.length - 1]);
                }
            }
        }
    });
    // Compose item_description
    const descParts = [];
    if (data.size) descParts.push('Size: ' + data.size);
    if (data.color) descParts.push('Color: ' + data.color);
    if (data.total_lot) descParts.push('Quantity: ' + data.total_lot);
    data.item_description = descParts.join(', ');
    return data;
}

// Handles parse button click
document.getElementById('parseBtn').addEventListener('click', () => {
    const message = document.getElementById('messageInput').value;
    const data = parseMessage(message);
    if (!data.recipient_name || !data.recipient_phone || !data.recipient_address || !data.cod_amount) {
        alert('Failed to parse all required fields. Please check your message.');
        return;
    }
    // Set preview
    document.getElementById('prev-name').textContent = data.recipient_name;
    document.getElementById('prev-phone').textContent = data.recipient_phone;
    document.getElementById('prev-address').textContent = data.recipient_address;
    document.getElementById('prev-cod').textContent = data.cod_amount;
    document.getElementById('prev-desc').textContent = data.item_description || '';
    document.getElementById('prev-lot').textContent = data.total_lot || '';
    // Store data on preview element
    document.getElementById('preview').dataset.order = JSON.stringify(data);
    document.getElementById('preview').style.display = 'block';
});

// Handles confirm button click
document.getElementById('confirmBtn').addEventListener('click', async () => {
    const previewEl = document.getElementById('preview');
    const data = JSON.parse(previewEl.dataset.order);
    // Add invoice and other required fields
    const invoice = 'INV-' + Date.now();
    const order = {
        invoice: invoice,
        recipient_name: data.recipient_name,
        recipient_phone: data.recipient_phone,
        alternative_phone: '',
        recipient_email: '',
        recipient_address: data.recipient_address,
        cod_amount: data.cod_amount,
        note: '',
        item_description: data.item_description,
        total_lot: data.total_lot || 0,
        delivery_type: 0
    };
    try {
        const response = await fetch('/create-parcel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('result').textContent =
                'Parcel created successfully! Consignment ID: ' +
                (result.consignment ? result.consignment.consignment_id : '');
        } else {
            document.getElementById('result').textContent =
                'Error creating parcel: ' + (result.error || JSON.stringify(result));
        }
    } catch (err) {
        document.getElementById('result').textContent = 'Network error: ' + err.message;
    }
});
