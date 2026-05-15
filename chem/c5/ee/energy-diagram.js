// energy-diagram.js - Enhanced Energy Profile Rendering
class EnergyDiagram {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.setupCanvas();
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.offsetWidth * dpr;
    this.canvas.height = this.canvas.offsetHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  draw(reaction, progress, hasCatalyst) {
    const ctx = this.ctx;
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1a1f35");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const isExo = reaction.type === "exothermic";
    const startX = padding;
    const endX = width - padding;
    const midX = startX + graphWidth / 2;

    const reactY = isExo
      ? padding + graphHeight * 0.3
      : padding + graphHeight * 0.7;
    const prodY = isExo
      ? padding + graphHeight * 0.8
      : padding + graphHeight * 0.2;

    const eaHeightUncat = reaction.activationEnergy * 0.5;
    const peakYUncat = Math.max(padding, reactY - eaHeightUncat);

    const eaHeightCat = reaction.catalyzedActivationEnergy
      ? reaction.catalyzedActivationEnergy * 0.5
      : eaHeightUncat * 0.6;
    const peakYCat = Math.max(padding, reactY - eaHeightCat);

    // Draw enhanced background grid
    this.drawGrid(ctx, width, height, padding, graphHeight);

    // Draw axes with enhanced styling
    this.drawAxes(ctx, width, height, padding);

    // Draw axis labels
    this.drawAxisLabels(ctx, padding, width, height);

    // Draw energy level lines
    this.drawEnergyLevels(ctx, startX, endX, reactY, prodY);

    // Draw reaction curves
    this.drawCurves(
      ctx,
      startX,
      endX,
      midX,
      reactY,
      prodY,
      peakYUncat,
      peakYCat,
      hasCatalyst,
      isExo,
      reaction.catalyzedActivationEnergy,
    );

    // Draw labels
    this.drawLabels(ctx, startX, endX, reactY, prodY);

    // Draw energy change annotation
    this.drawEnergyAnnotation(
      ctx,
      endX,
      reactY,
      prodY,
      reaction.enthalpyChange,
      isExo,
    );

    // Draw activation energy annotation
    this.drawActivationEnergyAnnotation(
      ctx,
      midX,
      reactY,
      peakYUncat,
      peakYCat,
      hasCatalyst,
      reaction.catalyzedActivationEnergy,
    );

    // Draw progress indicator
    if (progress > 0 && progress < 1) {
      this.drawProgressIndicator(
        ctx,
        startX,
        endX,
        reactY,
        prodY,
        peakYUncat,
        peakYCat,
        progress,
        hasCatalyst,
        reaction.catalyzedActivationEnergy,
      );
    }
  }

  drawGrid(ctx, width, height, padding, graphHeight) {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  drawAxes(ctx, width, height, padding) {
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding + 10);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding - 10, height - padding);
    ctx.lineTo(width - padding + 20, height - padding);
    ctx.stroke();

    // Arrow heads
    this.drawArrowHead(
      ctx,
      padding,
      padding,
      padding,
      padding - 15,
      6,
      "#64748b",
    );
    this.drawArrowHead(
      ctx,
      width - padding + 20,
      height - padding,
      width - padding + 35,
      height - padding,
      6,
      "#64748b",
    );
  }

  drawArrowHead(ctx, fromX, fromY, toX, toY, size, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - size * Math.cos(angle - Math.PI / 6),
      toY - size * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      toX - size * Math.cos(angle + Math.PI / 6),
      toY - size * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  }

  drawAxisLabels(ctx, padding, width, height) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "right";
    ctx.save();
    ctx.translate(padding - 25, padding - 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Energy", 0, 0);
    ctx.restore();

    ctx.textAlign = "end";
    ctx.fillText(
      "Progress of Reaction →",
      width - padding - 10,
      height - padding + 25,
    );
  }

  drawEnergyLevels(ctx, startX, endX, reactY, prodY) {
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);

    ctx.beginPath();
    ctx.moveTo(startX, reactY);
    ctx.lineTo(endX, reactY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, prodY);
    ctx.lineTo(endX, prodY);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  drawCurves(
    ctx,
    startX,
    endX,
    midX,
    reactY,
    prodY,
    peakYUncat,
    peakYCat,
    hasCatalyst,
    isExo,
    hasCalyzedEA,
  ) {
    // Uncatalyzed curve
    ctx.strokeStyle =
      hasCatalyst && hasCalyzedEA ? "#64748b" : isExo ? "#ef4444" : "#3b82f6";
    ctx.lineWidth = hasCatalyst && hasCalyzedEA ? 2 : 4;
    ctx.setLineDash(hasCatalyst && hasCalyzedEA ? [5, 5] : []);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(startX, reactY);
    ctx.lineTo(startX + 50, reactY);
    ctx.quadraticCurveTo(midX, peakYUncat - 50, endX - 50, prodY);
    ctx.lineTo(endX, prodY);
    ctx.stroke();

    // Catalyzed curve
    if (hasCalyzedEA) {
      ctx.strokeStyle = hasCatalyst
        ? isExo
          ? "#ef4444"
          : "#3b82f6"
        : "#10b981";
      ctx.lineWidth = hasCatalyst ? 4 : 2;
      ctx.setLineDash(!hasCatalyst ? [5, 5] : []);

      ctx.beginPath();
      ctx.moveTo(startX, reactY);
      ctx.lineTo(startX + 50, reactY);
      ctx.quadraticCurveTo(midX, peakYCat - 50, endX - 50, prodY);
      ctx.lineTo(endX, prodY);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  drawLabels(ctx, startX, endX, reactY, prodY) {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Reactants", startX + 10, reactY - 18);

    ctx.textAlign = "right";
    ctx.fillText("Products", endX - 10, prodY - 18);
  }

  drawEnergyAnnotation(ctx, arrowX, reactY, prodY, enthalpyChange, isExo) {
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(arrowX, reactY);
    ctx.lineTo(arrowX, prodY);
    ctx.stroke();

    // Arrow head
    const arrowSize = 7;
    ctx.fillStyle = "#f8fafc";
    if (isExo) {
      ctx.beginPath();
      ctx.moveTo(arrowX - 5, prodY - arrowSize);
      ctx.lineTo(arrowX + 5, prodY - arrowSize);
      ctx.lineTo(arrowX, prodY);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(arrowX - 5, reactY + arrowSize);
      ctx.lineTo(arrowX + 5, reactY + arrowSize);
      ctx.lineTo(arrowX, reactY);
      ctx.fill();
    }

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      `ΔH = ${enthalpyChange > 0 ? "+" : ""}${enthalpyChange}`,
      arrowX + 12,
      (reactY + prodY) / 2,
    );
  }

  drawActivationEnergyAnnotation(
    ctx,
    eaX,
    reactY,
    peakYUncat,
    peakYCat,
    hasCatalyst,
    catalyzedEA,
  ) {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    const peakToUse = hasCatalyst && catalyzedEA ? peakYCat : peakYUncat;

    ctx.beginPath();
    ctx.moveTo(eaX, reactY);
    ctx.lineTo(eaX, peakToUse);
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Ea", eaX + 10, (reactY + peakToUse) / 2);

    if (catalyzedEA) {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(eaX, reactY);
      ctx.lineTo(eaX, peakYCat);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawProgressIndicator(
    ctx,
    startX,
    endX,
    reactY,
    prodY,
    peakYUncat,
    peakYCat,
    progress,
    hasCatalyst,
    catalyzedEA,
  ) {
    let dotX = startX + 25;
    let dotY = reactY;

    dotX = startX + 50 + (endX - 100) * progress;
    const peakToUse = hasCatalyst && catalyzedEA ? peakYCat : peakYUncat;

    if (progress < 0.5) {
      const p = progress * 2;
      dotY = reactY - (reactY - peakToUse) * p;
    } else {
      const p = (progress - 0.5) * 2;
      dotY = peakToUse + (prodY - peakToUse) * p;
    }

    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.beginPath();
    ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
  }
}
