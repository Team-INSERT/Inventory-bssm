"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Hash, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom Premium Dropdown Component
function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder,
  className,
  dropdownClassName,
  icon: Icon
}: { 
  value: string, 
  onChange: (val: string) => void, 
  options: { value: string, label: string, colorClass?: string }[],
  placeholder: string,
  className?: string,
  dropdownClassName?: string,
  icon?: any
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-950 rounded-full cursor-pointer border border-transparent transition-all hover:bg-gray-100 dark:hover:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-500/20",
          isOpen && "border-blue-500/30 ring-2 ring-blue-500/20",
          selectedOption?.colorClass,
          className
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
          <span className={cn("text-sm font-bold truncate", !selectedOption && "text-gray-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/5 overflow-hidden",
              dropdownClassName
            )}
          >
            <div className="max-h-60 overflow-y-auto p-1 scrollbar-hide">
              {options.map((opt) => (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm font-bold transition-colors group",
                    value === opt.value ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {opt.colorClass && (
                      <span className={cn("w-2 h-2 rounded-full", opt.colorClass.includes('emerald') ? 'bg-emerald-500' : opt.colorClass.includes('blue') ? 'bg-blue-500' : opt.colorClass.includes('amber') ? 'bg-amber-500' : opt.colorClass.includes('red') ? 'bg-red-500' : 'bg-gray-400')} />
                    )}
                    {opt.label}
                  </div>
                  {value === opt.value && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SerialManagementClient({ 
  item, 
  warehouses, 
  initialSerials 
}: { 
  item: any;
  warehouses: any[];
  initialSerials: any[];
}) {
  const [newSerial, setNewSerial] = useState("");
  const [selectedWarehouseForNewSerial, setSelectedWarehouseForNewSerial] = useState("none");
  const [isAdding, setIsAdding] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [serials, setSerials] = useState<any[]>(initialSerials); 

  const handleAddSerial = async () => {
    if (!newSerial.trim()) return;
    setIsAdding(true);
    
    const newSerialsArray = newSerial.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    
    if (newSerialsArray.length > 0) {
      const added = newSerialsArray.map((s, idx) => ({
        id: `mock-new-${Date.now()}-${idx}`,
        serial_number: s,
        status: 'AVAILABLE',
        warehouse_id: selectedWarehouseForNewSerial !== 'none' ? selectedWarehouseForNewSerial : null
      }));
      setSerials([...added, ...serials]);
      setNewSerial("");
    }
    setIsAdding(false);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setSerials(serials.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleDelete = (id: string) => {
    setSerials(serials.filter(s => s.id !== id));
  };

  const warehouseOptions = [
    { value: 'none', label: '초기 창고 지정 안함 (미할당)' },
    ...warehouses.map(w => ({ value: w.id, label: w.name }))
  ];

  const statusOptions = [
    { value: 'AVAILABLE', label: '사용 가능', colorClass: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" },
    { value: 'IN_USE', label: '사용 중', colorClass: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10" },
    { value: 'DISPOSED', label: '폐기됨', colorClass: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10" },
    { value: 'REPAIR', label: '수리 중', colorClass: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10" }
  ];

  return (
    <div className="space-y-6">
      {/* Registration Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-zinc-800 shadow-sm relative z-10 flex flex-col">
        {/* Background icon with overflow hidden wrapper */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className="absolute top-0 right-0 p-8 text-gray-100 dark:text-zinc-800/50">
            <Hash className="w-32 h-32 -rotate-12 transform" />
          </div>
        </div>

        <div className="relative z-20 p-6">
          <h2 className="text-lg font-black tracking-tight text-gray-700 dark:text-white mb-2">
            새 시리얼 번호 등록
          </h2>
          <p className="text-xs text-gray-500 font-bold mb-6">등록 모드를 선택하고 시리얼 넘버를 입력하세요</p>
          
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setMode('single')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                mode === 'single' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm" : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 border border-transparent"
              )}
            >
              단건 연속 등록
            </button>
            <button 
              onClick={() => setMode('bulk')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                mode === 'bulk' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm" : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 border border-transparent"
              )}
            >
              대량 입력 (Bulk)
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {mode === 'single' ? (
              <input 
                type="text"
                placeholder="바코드 스캐너로 입력하거나 모델 번호를 타이핑하세요" 
                value={newSerial} 
                onChange={(e) => setNewSerial(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSerial();
                  }
                }}
                className="w-full rounded-2xl bg-gray-50 dark:bg-zinc-950 border-0 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-shadow"
              />
            ) : (
              <textarea 
                placeholder="여러 개의 시리얼 번호를 줄바꿈 또는 쉼표로 구분하여 붙여넣으세요" 
                value={newSerial} 
                onChange={(e) => setNewSerial(e.target.value)} 
                rows={4}
                className="w-full rounded-2xl bg-gray-50 dark:bg-zinc-950 border-0 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
              />
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:flex-1 min-w-0">
                <CustomSelect 
                  value={selectedWarehouseForNewSerial}
                  onChange={setSelectedWarehouseForNewSerial}
                  options={warehouseOptions}
                  placeholder="창고 선택"
                  className="w-full h-full"
                />
              </div>
              <button 
                onClick={handleAddSerial} 
                disabled={isAdding || !newSerial.trim()}
                className="w-full sm:w-auto whitespace-nowrap bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-black tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                {isAdding ? <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" /> : <Plus className="w-5 h-5" />}
                등록하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Serial List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black tracking-tight text-gray-900 dark:text-white">
            등록된 시리얼 리스트 <span className="text-gray-400 ml-1">({initialSerials.length})</span>
          </h3>
        </div>
        
        {initialSerials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 relative z-0">
            <AnimatePresence>
              {serials.map((serial, index) => {
                const assignedWarehouse = warehouses.find(w => w.id === serial.warehouse_id);
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={serial.id} 
                    style={{ zIndex: serials.length - index }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 rounded-2xl p-4 gap-4 hover:shadow-md transition-all group hover:border-blue-500/30 relative"
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-sm tracking-tight">{serial.serial_number}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mt-1",
                        assignedWarehouse ? "text-gray-400" : "text-amber-500"
                      )}>
                        {assignedWarehouse ? assignedWarehouse.name : '미할당 상태 (위치 불명)'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                      <div className="w-36">
                        <CustomSelect 
                          value={serial.status}
                          onChange={(val) => handleStatusChange(serial.id, val)}
                          options={statusOptions}
                          placeholder="상태 변경"
                          className="px-3 py-1.5 rounded-xl border-0 !bg-transparent !ring-0 !shadow-none min-h-[36px]"
                          dropdownClassName="w-40 right-0 origin-top-right"
                        />
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(serial.id)}
                        className="text-gray-300 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-100 sm:opacity-50 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-black/5 dark:border-zinc-800">
            <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-black/5 dark:border-zinc-700">
              <Hash className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">등록된 시리얼이 없습니다</h4>
            <p className="text-xs text-gray-500 font-medium">위 폼에서 바코드를 스캔하거나 타이핑하여 첫 자산을 등록하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
