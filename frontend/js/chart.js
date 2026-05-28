const ChartRenderer = {
    colors: {
        home: '#00ff88',
        draw: '#ffbe0b',
        away: '#ff3366',
        grid: 'rgba(0, 240, 255, 0.1)',
        text: '#a0aec0'
    },

    drawPieChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const total = parseFloat(data.home) + parseFloat(data.draw) + parseFloat(data.away);
        const percentages = [
            parseFloat(data.home) / total * 100,
            parseFloat(data.draw) / total * 100,
            parseFloat(data.away) / total * 100
        ];

        let startAngle = -Math.PI / 2;

        percentages.forEach((pct, index) => {
            const sliceAngle = (pct / 100) * 2 * Math.PI;
            const color = [this.colors.home, this.colors.draw, this.colors.away][index];
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            startAngle += sliceAngle;
        });

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(10, 14, 23, 0.9)';
        ctx.fill();

        const labels = ['主胜', '平局', '客胜'];
        const values = [data.home, data.draw, data.away];
        
        let labelAngle = -Math.PI / 2;
        ctx.font = '12px "Noto Sans SC"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        values.forEach((val, i) => {
            const midAngle = labelAngle + ((percentages[i] / 100) * Math.PI);
            const labelRadius = radius + 25;
            const x = centerX + Math.cos(midAngle) * labelRadius;
            const y = centerY + Math.sin(midAngle) * labelRadius;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${labels[i]}: ${val}%`, x, y);
            
            labelAngle += (percentages[i] / 100) * 2 * Math.PI;
        });
    },

    drawBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / 4;
        const barGap = barWidth / 4;

        ctx.clearRect(0, 0, width, height);

        const values = [parseFloat(data.home), parseFloat(data.draw), parseFloat(data.away)];
        const colors = [this.colors.home, this.colors.draw, this.colors.away];
        const labels = ['主胜', '平局', '客胜'];

        const maxValue = Math.max(...values);
        const scale = (height - 60) / maxValue;

        values.forEach((val, index) => {
            const barHeight = val * scale;
            const x = barGap + index * (barWidth);
            const y = height - 40 - barHeight;

            const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
            gradient.addColorStop(0, colors[index]);
            gradient.addColorStop(1, this.adjustColor(colors[index], -30));
            
            ctx.fillStyle = gradient;
            this.roundRect(ctx, x, y, barWidth - barGap, barHeight, 8);
            ctx.fill();

            ctx.shadowColor = colors[index];
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px "Orbitron"';
            ctx.textAlign = 'center';
            ctx.fillText(`${val}%`, x + (barWidth - barGap) / 2, y - 10);

            ctx.fillStyle = this.colors.text;
            ctx.font = '12px "Noto Sans SC"';
            ctx.fillText(labels[index], x + (barWidth - barGap) / 2, height - 15);
        });
    },

    drawOverUnderChart(canvasId, overPct, underPct) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const total = parseFloat(overPct) + parseFloat(underPct);
        const overAngle = (parseFloat(overPct) / total) * Math.PI * 2;
        const underAngle = (parseFloat(underPct) / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, overAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = this.colors.home;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, overAngle, Math.PI * 2);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = this.colors.draw;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(10, 14, 23, 0.9)';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Orbitron"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${overPct}%`, centerX, centerY - 10);
        ctx.font = '12px "Noto Sans SC"';
        ctx.fillText('大球', centerX, centerY + 15);
    },

    drawRadarChart(canvasId, homeData, awayData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 30;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const metrics = ['进攻', '防守', '控球', '主场', '状态', '战术'];
        const numPoints = metrics.length;
        const angleStep = (Math.PI * 2) / numPoints;

        const drawGrid = (scale) => {
            ctx.beginPath();
            for (let i = 0; i <= numPoints; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius * scale;
                const y = centerY + Math.sin(angle) * radius * scale;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.strokeStyle = this.colors.grid;
            ctx.stroke();
        };

        for (let i = 0.2; i <= 1; i += 0.2) {
            drawGrid(i);
        }

        metrics.forEach((metric, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = this.colors.grid;
            ctx.stroke();

            ctx.fillStyle = this.colors.text;
            ctx.font = '11px "Noto Sans SC"';
            ctx.textAlign = 'center';
            ctx.fillText(metric, x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
        });

        const drawData = (data, color) => {
            ctx.beginPath();
            data.forEach((value, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius * (value / 100);
                const y = centerY + Math.sin(angle) * radius * (value / 100);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.closePath();
            ctx.fillStyle = color.replace(')', ', 0.3)').replace('rgb', 'rgba');
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            data.forEach((value, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius * (value / 100);
                const y = centerY + Math.sin(angle) * radius * (value / 100);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            });
        };

        const homeValues = homeData || [75, 70, 65, 80, 72, 68];
        const awayValues = awayData || [68, 75, 60, 50, 65, 72];
        
        drawData(homeValues, this.colors.home);
        drawData(awayValues, this.colors.away);
    },

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    },

    updateAllCharts(prediction) {
        setTimeout(() => {
            this.drawPieChart('fulltime-chart', prediction.fullTime);
            this.drawBarChart('halftime-chart', prediction.halfTime);
            this.drawBarChart('secondhalf-chart', prediction.secondHalf);
            this.drawOverUnderChart('ou-chart', prediction.overUnder.over, prediction.overUnder.under);
            
            const homeData = [
                70 + Math.random() * 20,
                65 + Math.random() * 20,
                60 + Math.random() * 20,
                75 + Math.random() * 20,
                70 + Math.random() * 20,
                68 + Math.random() * 20
            ];
            const awayData = [
                65 + Math.random() * 20,
                70 + Math.random() * 20,
                55 + Math.random() * 20,
                45 + Math.random() * 20,
                65 + Math.random() * 20,
                70 + Math.random() * 20
            ];
            this.drawRadarChart('fulltime-chart', homeData, awayData);
        }, 100);
    }
};
