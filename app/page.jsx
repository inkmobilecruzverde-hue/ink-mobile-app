"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function Home() {

  const [orders, setOrders] = useState([]);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dispositivo, setDispositivo] = useState("");
  const [problema, setProblema] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState(null);

  const canvasRef = useRef(null);
  let drawing = false;

  // 🔄 Cargar órdenes
  const loadOrders = async () => {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ✍️ Firma
  const startDrawing = () => drawing = true;
  const stopDrawing = () => drawing = false;

  const draw = (e) => {
    if (!drawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  // 📸 Reducir imagen (SOLUCIÓN ERROR)
  const reducirImagen = (file) => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const maxWidth = 400;
          const scale = maxWidth / img.width;

          canvas.width = maxWidth;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgReducida = await reducirImagen(file);
    setImagen(imgReducida);
  };

  // 💾 Guardar
  const handleGuardar = async () => {
    try {

      const firma = canvasRef.current.toDataURL();

      await addDoc(collection(db, "orders"), {
        nombre,
        telefono,
        dispositivo,
        problema,
        precio,
        estado: "Recibido",
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        imagen: imagen || null,
        firma
      });

      alert("Guardado correctamente");

      limpiarFormulario();
      loadOrders();

      setTimeout(() => window.print(), 500);

    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setTelefono("");
    setDispositivo("");
    setProblema("");
    setPrecio("");
    setImagen(null);
    limpiarFirma();
  };

  // ❌ Eliminar
  const eliminarOrden = async (id) => {
    await deleteDoc(doc(db, "orders", id));
    loadOrders();
  };

  // 🔄 Estado
  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "orders", id), { estado });
    loadOrders();
  };

  // 📲 WhatsApp
  const enviarWhatsApp = (o) => {
    const msg = `Hola ${o.nombre}, tu ${o.dispositivo} está en estado: ${o.estado}`;
    window.open(`https://wa.me/${o.telefono}?text=${encodeURIComponent(msg)}`);
  };

  const estados = ["Recibido", "Pendiente", "Recambio", "Finalizado"];

  return (
    <div style={{ padding: 20 }}>
      <h1>🔧 Ink-Mobile PRO</h1>

      {/* FORMULARIO */}
      <div>
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
        <input placeholder="Dispositivo" value={dispositivo} onChange={e => setDispositivo(e.target.value)} />
        <input placeholder="Problema" value={problema} onChange={e => setProblema(e.target.value)} />
        <input placeholder="Precio" value={precio} onChange={e => setPrecio(e.target.value)} />

        <br /><br />

        <input type="file" onChange={handleImagen} />

        <br /><br />

        <canvas
          ref={canvasRef}
          width={300}
          height={150}
          style={{ border: "1px solid black" }}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />

        <br />
        <button onClick={limpiarFirma}>Limpiar firma</button>

        <br /><br />

        <button onClick={handleGuardar}>Guardar + imprimir</button>
      </div>

      <hr />

      {/* COLUMNAS */}
      <div style={{ display: "flex", gap: 20 }}>
        {estados.map((estado) => (
          <div key={estado} style={{ flex: 1 }}>
            <h3>{estado}</h3>

            {orders
              .filter(o => o.estado === estado)
              .map(o => (
                <div key={o.id} style={{ border: "1px solid #ccc", margin: 5, padding: 5 }}>
                  <strong>{o.nombre}</strong><br />
                  {o.dispositivo}<br />
                  {o.problema}<br />

                  <select value={o.estado} onChange={(e) => cambiarEstado(o.id, e.target.value)}>
                    {estados.map(e => <option key={e}>{e}</option>)}
                  </select>

                  <br />

                  <button onClick={() => enviarWhatsApp(o)}>WhatsApp</button>
                  <button onClick={() => eliminarOrden(o.id)}>Eliminar</button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
