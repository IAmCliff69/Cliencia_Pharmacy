import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { MedicineWithStockResponse } from "../types/medicine";

const colors = [
  "#168c83", "#e17b45", "#4776b8", "#cf5265", "#82a83c",
  "#d0a12e", "#3b9ec2", "#9367a8", "#d15f9c", "#6f8d59",
];

interface StockPieChartProps {
  medicines: MedicineWithStockResponse[];
  isLoading: boolean;
  isError: boolean;
  onSelectMedicine: (medicineId: number) => void;
}

function StockPieChart({ medicines, isLoading, isError, onSelectMedicine }: StockPieChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelectMedicine);
  const [hovered, setHovered] = useState<{
    medicine: MedicineWithStockResponse;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    selectRef.current = onSelectMedicine;
  }, [onSelectMedicine]);

  const totalUnits = medicines.reduce(
    (total, medicine) => total + (medicine.inventory?.quantity_available ?? 0),
    0,
  );
  const stockedMedicines = medicines.filter(
    (medicine) => (medicine.inventory?.quantity_available ?? 0) > 0,
  );

  useEffect(() => {
    const host = hostRef.current;
    const chartMedicines = medicines.filter(
      (medicine) => (medicine.inventory?.quantity_available ?? 0) > 0,
    );
    if (!host || chartMedicines.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.up.set(0, 0, 1);
    camera.position.set(0, 7.5, 6.3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-label", "Interactive medicine stock pie chart");
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
    keyLight.position.set(-3, 5, 9);
    scene.add(keyLight);

    const chart = new THREE.Group();
    scene.add(chart);
    const meshes: THREE.Mesh[] = [];
    const totalStock = chartMedicines.reduce(
      (total, medicine) => total + (medicine.inventory?.quantity_available ?? 0),
      0,
    );
    let startAngle = -Math.PI / 2;

    chartMedicines.forEach((medicine) => {
      const quantity = medicine.inventory?.quantity_available ?? 0;
      const endAngle = startAngle + (quantity / totalStock) * Math.PI * 2;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, 2.1, startAngle, endAngle, false);
      shape.lineTo(0, 0);

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.28,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.035,
        bevelThickness: 0.035,
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, 0, 0);

      const material = new THREE.MeshStandardMaterial({
        color: colors[medicines.findIndex((item) => item.medicine_id === medicine.medicine_id) % colors.length],
        roughness: 0.48,
        metalness: 0.04,
      });
      const slice = new THREE.Mesh(geometry, material);
      slice.userData.medicine = medicine;
      slice.userData.basePosition = new THREE.Vector3();
      chart.add(slice);
      meshes.push(slice);
      startAngle = endAngle;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { x: number; y: number } | null = null;
    let isDragging = false;

    const render = () => renderer.render(scene, camera);
    const resizeObserver = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    });
    resizeObserver.observe(host);

    const findSlice = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(meshes, false)[0]?.object as THREE.Mesh | undefined;
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
      isDragging = false;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerStart && (event.buttons > 0)) {
        const deltaX = event.clientX - pointerStart.x;
        const deltaY = event.clientY - pointerStart.y;
        if (Math.abs(deltaX) + Math.abs(deltaY) > 4) isDragging = true;
        if (isDragging) {
          chart.rotation.y += deltaX * 0.008;
          chart.rotation.x = THREE.MathUtils.clamp(chart.rotation.x + deltaY * 0.004, -0.35, 0.35);
          pointerStart = { x: event.clientX, y: event.clientY };
          setHovered(null);
          render();
          return;
        }
      }

      const slice = findSlice(event);
      renderer.domElement.style.cursor = slice ? "pointer" : "grab";
      setHovered(slice ? {
        medicine: slice.userData.medicine as MedicineWithStockResponse,
        x: event.clientX - host.getBoundingClientRect().left,
        y: event.clientY - host.getBoundingClientRect().top,
      } : null);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!isDragging) {
        const slice = findSlice(event);
        const medicine = slice?.userData.medicine as MedicineWithStockResponse | undefined;
        if (medicine) selectRef.current(medicine.medicine_id);
      }
      pointerStart = null;
      isDragging = false;
    };

    const onPointerLeave = () => {
      if (!pointerStart) setHovered(null);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    render();

    return () => {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      chart.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [medicines]);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Medicine stock</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Available units across the inventory</p>
        </div>
        <div className="flex gap-5 text-right">
          <div>
            <p className="font-display text-xl font-bold text-ink">{medicines.length}</p>
            <p className="text-xs text-ink-muted">medicines</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-ink">{totalUnits.toLocaleString()}</p>
            <p className="text-xs text-ink-muted">units in stock</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-sm text-ink-muted">Loading inventory...</div>
      ) : isError ? (
        <div className="flex h-64 items-center justify-center text-sm text-danger">Could not load medicine stock.</div>
      ) : medicines.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-ink-muted">No medicines in the inventory yet.</div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
          <div ref={hostRef} className="relative h-64 min-w-0 sm:h-72">
            {stockedMedicines.length === 0 ? (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
                All medicines currently have zero available stock.
              </p>
            ) : (
              <>
                {hovered && (
                  <div
                    className="pointer-events-none absolute z-10 max-w-52 rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg"
                    style={{ left: Math.min(hovered.x + 12, 220), top: Math.max(hovered.y - 48, 4) }}
                  >
                    <p className="font-semibold text-ink">{hovered.medicine.medicine_name}</p>
                    <p className="text-ink-muted">
                      {hovered.medicine.inventory?.quantity_available ?? 0} units
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto border-t border-border p-3 md:border-l md:border-t-0">
            {medicines.map((medicine, index) => (
              <button
                key={medicine.medicine_id}
                type="button"
                onClick={() => onSelectMedicine(medicine.medicine_id)}
                className="flex w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="truncate text-sm text-ink">{medicine.medicine_name}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                  {(medicine.inventory?.quantity_available ?? 0).toLocaleString()} units
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default StockPieChart;