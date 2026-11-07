// 1. ESTADO GLOBAL (Datos Editables)
let datosPrendas = [
    { id: 'X1', nombre: 'Polo', costo: 15.00, venta: 75.00, tiempo: 96 },
    { id: 'X2', nombre: 'Manga Corta', costo: 15.75, venta: 85.00, tiempo: 80 },
    { id: 'X3', nombre: 'Manga Larga', costo: 66.50, venta: 150.00, tiempo: 96 },
    { id: 'X4', nombre: 'Columbia', costo: 76.00, venta: 180.00, tiempo: 160 },
    { id: 'X5', nombre: 'Pantalón', costo: 52.50, venta: 160.00, tiempo: 240 },
    { id: 'X6', nombre: 'Pants', costo: 30.00, venta: 90.00, tiempo: 120 },
    { id: 'X7', nombre: 'Pantaloneta', costo: 28.50, venta: 70.00, tiempo: 80 }
];

// 2. CONTROL DE VISTAS (SPA)
function cambiarVista(idVista) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById(idVista).classList.add('activa');
    
    if (idVista === 'vista-principal') {
        renderizarTabla();
    } else if (idVista === 'vista-editar') {
        renderizarFormulario();
    }
}

// 3. RENDERIZADO DE INTERFAZ
function renderizarTabla() {
    const tbody = document.getElementById('tabla-datos');
    tbody.innerHTML = `<tr><th>Var</th><th>Prenda</th><th>Costo Tela (Q)</th><th>Precio Venta (Q)</th><th>Utilidad Unitaria (Q)</th><th>Tiempo (min)</th></tr>`;
    
    datosPrendas.forEach(p => {
        let utilidad = p.venta - p.costo;
        tbody.innerHTML += `
            <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.nombre}</td>
                <td>${p.costo.toFixed(2)}</td>
                <td>${p.venta.toFixed(2)}</td>
                <td style="color: var(--success); font-weight: bold;">${utilidad.toFixed(2)}</td>
                <td>${p.tiempo}</td>
            </tr>
        `;
    });
}

function renderizarFormulario() {
    const form = document.getElementById('form-edicion');
    form.innerHTML = '';
    
    datosPrendas.forEach((p, index) => {
        form.innerHTML += `
            <div class="card-edit">
                <h4>${p.id}: ${p.nombre}</h4>
                <label>Costo Tela (Q): <input type="number" id="costo-${index}" value="${p.costo}" step="0.5"></label>
                <label>Precio Venta (Q): <input type="number" id="venta-${index}" value="${p.venta}" step="1"></label>
                <label>Tiempo (min): <input type="number" id="tiempo-${index}" value="${p.tiempo}"></label>
            </div>
        `;
    });
}

function guardarEdicion() {
    datosPrendas.forEach((p, index) => {
        p.costo = parseFloat(document.getElementById(`costo-${index}`).value);
        p.venta = parseFloat(document.getElementById(`venta-${index}`).value);
        p.tiempo = parseFloat(document.getElementById(`tiempo-${index}`).value);
    });
    
    document.getElementById('resultados-section').style.display = 'none';
    cambiarVista('vista-principal');
    alert("Datos actualizados correctamente. Vuelve a calcular los escenarios.");
}

// Lógica para actualizar el display de minutos en tiempo real
function actualizarDisplayMinutos() {
    const p = parseFloat(document.getElementById('input-personas').value) || 0;
    const h = parseFloat(document.getElementById('input-horas').value) || 0;
    const d = parseFloat(document.getElementById('input-dias').value) || 0;
    
    const minutosTotales = p * h * d * 60;
    document.getElementById('display-minutos').innerText = minutosTotales;
}

// Asignar los eventos de input
document.getElementById('input-personas').addEventListener('input', actualizarDisplayMinutos);
document.getElementById('input-horas').addEventListener('input', actualizarDisplayMinutos);
document.getElementById('input-dias').addEventListener('input', actualizarDisplayMinutos);


// 4. LÓGICA MATEMÁTICA Y ESCENARIOS
function procesarEscenarios() {
    if (typeof solver === 'undefined') { 
        alert("Error: El motor matemático no cargó. Verifica tu conexión a internet."); 
        return; 
    }

    const pMax = parseFloat(document.getElementById('input-ppto').value);
    
    // Capturar el tiempo desde los 3 inputs
    const p = parseFloat(document.getElementById('input-personas').value);
    const h = parseFloat(document.getElementById('input-horas').value);
    const d = parseFloat(document.getElementById('input-dias').value);
    const tMax = p * h * d * 60; // Total en minutos

    if (tMax <= 0 || isNaN(tMax)) {
        alert("El tiempo disponible debe ser mayor a 0.");
        return;
    }

    let varsSolver = {};
    let intsSolver = {};
    
    datosPrendas.forEach(prenda => {
        let utilidad = prenda.venta - prenda.costo;
        varsSolver[prenda.id] = { ganancia: utilidad, tiempo: prenda.tiempo, presupuesto: prenda.costo, unidades: 1 };
        intsSolver[prenda.id] = 1;
        
        if(prenda.id === 'X5') varsSolver[prenda.id].demandaPantalon = 1;
        if(prenda.id === 'X4') varsSolver[prenda.id].demandaColumbia = 1;
    });

    const modeloA = {
        optimize: "ganancia", opType: "max",
        constraints: { tiempo: { max: tMax }, presupuesto: { max: pMax }, demandaPantalon: { min: 5 }, demandaColumbia: { max: 10 } },
        variables: varsSolver, ints: intsSolver
    };

    const modeloB = {
        optimize: "unidades", opType: "max",
        constraints: { tiempo: { max: tMax }, presupuesto: { max: pMax }, demandaPantalon: { min: 5 }, demandaColumbia: { max: 10 } },
        variables: varsSolver, ints: intsSolver
    };

    // Escenario C: Eficiencia (Calculado como si fuera 1 día menos, pero asegurando que d > 1)
    let tMaxCorto = tMax;
    if (d > 1) {
        tMaxCorto = p * h * (d - 1) * 60;
    } else {
        // Si solo trabajan 1 día, recortamos el 20% de las horas como ejemplo de eficiencia
        tMaxCorto = Math.floor(tMax * 0.8);
    }
    
    const modeloC = {
        optimize: "ganancia", opType: "max",
        constraints: { tiempo: { max: tMaxCorto }, presupuesto: { max: pMax }, demandaPantalon: { min: 5 }, demandaColumbia: { max: 10 } },
        variables: varsSolver, ints: intsSolver
    };

    const resA = solver.Solve(modeloA);
    const resB = solver.Solve(modeloB);
    const resC = solver.Solve(modeloC);

    dibujarEscenarios(resA, resB, resC, pMax, tMax, tMaxCorto, d);
}

function evaluarResultados(res) {
    let ganancia = 0, ppto = 0, tiempo = 0, unidades = 0;
    let listado = "", mathZ = "", mathPpto = "", mathTiempo = "", mathVol = "";
    
    if (!res.feasible) return null;

    datosPrendas.forEach(p => {
        let qty = res[p.id] || 0;
        if (qty > 0) {
            let util = p.venta - p.costo;
            ganancia += qty * util;
            ppto += qty * p.costo;
            tiempo += qty * p.tiempo;
            unidades += qty;
            
            listado += `<li><span>${p.id}: ${p.nombre}</span> <strong>${qty} uds.</strong></li>`;
            mathZ += `+ (${qty} * Q${util.toFixed(2)}) `;
            mathPpto += `+ (${qty} * Q${p.costo.toFixed(2)}) `;
            mathTiempo += `+ (${qty} * ${p.tiempo}m) `;
            mathVol += `+ ${qty} `;
        }
    });

    return { 
        ganancia, ppto, tiempo, unidades, listado, 
        mathZ: mathZ.substring(2) || "0", 
        mathPpto: mathPpto.substring(2) || "0", 
        mathTiempo: mathTiempo.substring(2) || "0",
        mathVol: mathVol.substring(2) || "0"
    };
}

function dibujarEscenarios(resA, resB, resC, pMax, tMax, tMaxCorto, diasOriginales) {
    const grid = document.getElementById('grid-escenarios');
    grid.innerHTML = '';

    const dataA = evaluarResultados(resA);
    const dataB = evaluarResultados(resB);
    const dataC = evaluarResultados(resC);

    if(!dataA) { 
        grid.innerHTML = "<h3 style='color:red; grid-column: 1/-1; text-align:center;'>❌ Solución Infactible. Aumenta el presupuesto o tiempo.</h3>"; 
        document.getElementById('calculos-detallados').style.display = 'none';
        document.getElementById('resultados-section').style.display = 'block';
        return; 
    }

    grid.innerHTML += generarCard("Camino A: Rentabilidad Óptima", "Maximiza el dinero ganado usando los recursos actuales.", dataA, true);
    grid.innerHTML += generarCard("Camino B: Alto Volumen", "Prioriza hacer muchas prendas para rotar inventario rápido.", dataB, false);
    
    let tituloC = diasOriginales > 1 ? `Camino C: Eficiencia (${diasOriginales - 1} Días)` : "Camino C: Jornada Reducida (-20%)";
    let descC = diasOriginales > 1 ? "Maximiza la ganancia descansando un día a la semana." : "Maximiza la ganancia trabajando menos horas hoy.";
    grid.innerHTML += generarCard(tituloC, descC, dataC, false);

    document.getElementById('resultados-section').style.display = 'block';
    generarFormulacionMatematica(dataA, dataB, dataC, pMax, tMax, tMaxCorto, tituloC);
}

function generarCard(titulo, desc, data, esRecomendado) {
    if(!data) return '';
    const badge = esRecomendado ? `<div class="badge">⭐ El más rentable</div>` : '';
    const claseR = esRecomendado ? 'recommended' : '';
    
    return `
        <div class="scenario-card ${claseR}">
            ${badge}
            <h3>${titulo}</h3>
            <p style="font-size:0.9rem; color:#64748b; margin-top:-5px;">${desc}</p>
            <div class="ganancia-text">Q${data.ganancia.toFixed(2)}</div>
            <ul class="lista-prendas">${data.listado}</ul>
            <div class="metrics">
                <span>Ppto: Q${data.ppto.toFixed(2)}</span>
                <span>Tiempo: ${data.tiempo}m</span>
                <span>Total: ${data.unidades} uds</span>
            </div>
        </div>
    `;
}

function generarFormulacionMatematica(dataA, dataB, dataC, pMax, tMax, tMaxCorto, tituloC) {
    const panel = document.getElementById('calculos-detallados');
    
    let funcObj = "", restTiempo = "", restPpto = "";
    
    datosPrendas.forEach(p => {
        let util = p.venta - p.costo;
        funcObj += `${util.toFixed(2)}(${p.id}) + `;
        restTiempo += `${p.tiempo}(${p.id}) + `;
        restPpto += `${p.costo.toFixed(2)}(${p.id}) + `;
    });
    
    funcObj = funcObj.slice(0, -3);
    restTiempo = restTiempo.slice(0, -3);
    restPpto = restPpto.slice(0, -3);

    panel.innerHTML = `
        <h4>1. Formulación del Modelo Lineal Base</h4>
        <span class="math-comment">// Función Objetivo (Maximizar Utilidad Z):</span><br>
        Z_max = ${funcObj}<br><br>
        
        <span class="math-comment">// Sujeto a (Restricciones):</span><br>
        T: ${restTiempo} ≤ ${tMax} <span class="math-comment">(Minutos disponibles)</span><br>
        P: ${restPpto} ≤ ${pMax} <span class="math-comment">(Presupuesto Q)</span><br>
        D1: X5 ≥ 5 <span class="math-comment">(Demanda mínima pantalones)</span><br>
        D2: X4 ≤ 10 <span class="math-comment">(Tope demanda Columbia)</span><br>
        NN: X_i ≥ 0, Enteros <span class="math-comment">(No negatividad e integralidad)</span><br><br>

        <h4>2. Triangulación Camino A (Rentabilidad Óptima)</h4>
        <span class="math-comment">// Sustitución de Utilidad (Z):</span><br>
        Z = ${dataA.mathZ} = <span class="math-highlight">Q${dataA.ganancia.toFixed(2)}</span><br>
        <span class="math-comment">// Comprobación de Restricciones:</span><br>
        Presupuesto: ${dataA.mathPpto} = Q${dataA.ppto.toFixed(2)} (Límite: Q${pMax}) <span class="math-highlight">✅ Factible</span><br>
        Tiempo: ${dataA.mathTiempo} = ${dataA.tiempo} min (Límite: ${tMax} min) <span class="math-highlight">✅ Factible</span><br><br>

        <h4>3. Triangulación Camino B (Alto Volumen)</h4>
        <span class="math-comment">// Función Objetivo cambiada a Maximizar Unidades (U):</span><br>
        U_max = X1 + X2 + X3 + X4 + X5 + X6 + X7<br>
        U = ${dataB.mathVol} = <span class="math-highlight">${dataB.unidades} prendas</span><br>
        <span class="math-comment">// Comprobación de Restricciones:</span><br>
        Presupuesto: ${dataB.mathPpto} = Q${dataB.ppto.toFixed(2)} (Límite: Q${pMax}) <span class="math-highlight">✅ Factible</span><br>
        Tiempo: ${dataB.mathTiempo} = ${dataB.tiempo} min (Límite: ${tMax} min) <span class="math-highlight">✅ Factible</span><br><br>

        <h4>4. Triangulación ${tituloC}</h4>
        <span class="math-comment">// Límite de tiempo reducido a ${tMaxCorto} minutos.</span><br>
        <span class="math-comment">// Sustitución de Utilidad (Z):</span><br>
        Z = ${dataC.mathZ} = <span class="math-highlight">Q${dataC.ganancia.toFixed(2)}</span><br>
        <span class="math-comment">// Comprobación de Restricciones:</span><br>
        Presupuesto: ${dataC.mathPpto} = Q${dataC.ppto.toFixed(2)} (Límite: Q${pMax}) <span class="math-highlight">✅ Factible</span><br>
        Tiempo: ${dataC.mathTiempo} = ${dataC.tiempo} min (Límite: ${tMaxCorto} min) <span class="math-highlight">✅ Factible</span>
    `;
}

function toggleCalculos() {
    const panel = document.getElementById('calculos-detallados');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

// Inicializar
actualizarDisplayMinutos();
renderizarTabla();
