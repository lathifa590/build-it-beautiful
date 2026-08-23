import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, CalendarDays, BookOpen, Clock, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Workspace } from "@/types/workspace";

interface MeetingSlot {
  id?: string;
  sequence: number;
  title: string;
  planned_jp: number;
  week_number?: number;
  planned_date?: string;
}

interface ProsemItem {
  id: string;
  sequence: number;
  materi_pokok: string;
  allocated_jp: number;
  semester: 1 | 2;
  slots: MeetingSlot[];
}

interface StepMeetingProps {
  workspace: Workspace;
  onNext: () => void;
}

export const StepMeeting: React.FC<StepMeetingProps> = ({ workspace, onNext }) => {
  const [items, setItems] = useState<ProsemItem[]>([]);
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Beban JP per pertemuan default dari workspace settings (biasanya 2 JP atau 3 JP)
  // Untuk sementara hardcode 2 JP
  const defaultJpPerMeeting = 2;
  const menitPerJp = 45; // SMP/SMA biasanya 40-45 menit

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Get prosem items
        const { data: prosemItems } = await supabase
          .from("prosem_items")
          .select("id, sequence, materi_pokok, allocated_jp, semester")
          .eq("workspace_id", workspace.id)
          .order("semester", { ascending: true })
          .order("sequence", { ascending: true });

        if (!prosemItems || prosemItems.length === 0) {
          setIsLoaded(true);
          return;
        }

        // 2. Get meeting slots for these items
        const { data: slots } = await supabase
          .from("meeting_slots")
          .select("id, prosem_item_id, sequence, title, planned_jp, week_number, planned_date")
          .eq("workspace_id", workspace.id)
          .order("prosem_item_id")
          .order("sequence", { ascending: true });

        // Map items
        const mappedItems: ProsemItem[] = prosemItems.map(item => {
          const itemSlots = slots?.filter(s => s.prosem_item_id === item.id) || [];
          
          return {
            id: item.id,
            sequence: item.sequence,
            materi_pokok: item.materi_pokok,
            allocated_jp: item.allocated_jp,
            semester: item.semester as 1 | 2,
            slots: itemSlots.length > 0 ? itemSlots : []
          };
        });

        setItems(mappedItems);
      } catch (err) {
        console.error("Error loading meeting slots:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    if (workspace.id) loadData();
  }, [workspace.id]);

  const handleAutoSuggest = (itemIndex: number) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    
    // Auto suggest meeting slots based on allocated_jp and defaultJpPerMeeting
    const numMeetings = Math.ceil(item.allocated_jp / defaultJpPerMeeting);
    const newSlots: MeetingSlot[] = [];
    
    let remainingJp = item.allocated_jp;
    
    for (let i = 0; i < numMeetings; i++) {
      const jpForThisSlot = Math.min(remainingJp, defaultJpPerMeeting);
      newSlots.push({
        sequence: i + 1,
        title: `Pertemuan ${i + 1}`,
        planned_jp: jpForThisSlot
      });
      remainingJp -= jpForThisSlot;
    }
    
    item.slots = newSlots;
    setItems(newItems);
  };

  const handleAddSlot = (itemIndex: number) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    
    item.slots.push({
      sequence: item.slots.length + 1,
      title: `Pertemuan ${item.slots.length + 1}`,
      planned_jp: defaultJpPerMeeting
    });
    
    setItems(newItems);
  };

  const handleUpdateSlot = (itemIndex: number, slotIndex: number, field: keyof MeetingSlot, value: any) => {
    const newItems = [...items];
    newItems[itemIndex].slots[slotIndex] = {
      ...newItems[itemIndex].slots[slotIndex],
      [field]: value
    };
    setItems(newItems);
  };

  const handleRemoveSlot = (itemIndex: number, slotIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].slots.splice(slotIndex, 1);
    
    // Resequence remaining slots
    newItems[itemIndex].slots.forEach((s, i) => {
      s.sequence = i + 1;
    });
    
    setItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    let hasError = false;

    try {
      // Save slots for each prosem item
      for (const item of items) {
        // Skip if no slots
        if (item.slots.length === 0) continue;

        const { error } = await supabase.rpc("save_meeting_slots", {
          p_workspace_id: workspace.id,
          p_prosem_item_id: item.id,
          p_slots: item.slots
        });

        if (error) {
          alert(`Gagal menyimpan jadwal untuk topik "${item.materi_pokok}": ${error.message}`);
          hasError = true;
          break; // Stop on first error
        }
      }

      if (!hasError) {
        onNext();
      }
    } catch (err: any) {
      alert("Error saving meeting slots: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  const currentSemesterItems = items.filter(i => i.semester === activeSemester);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h2 className="text-xl font-semibold mb-1">Susun Jadwal Pertemuan</h2>
        <p className="text-sm text-muted-foreground">Pecah topik materi dari Program Semester menjadi jadwal pertemuan riil (Meeting Slots).</p>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border border-dashed rounded-lg bg-slate-50">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Data Program Semester Kosong</p>
          <p className="text-sm text-muted-foreground mt-1">Silakan susun dan simpan Program Semester di Langkah 3 terlebih dahulu.</p>
        </div>
      ) : (
        <>
          <div className="flex border-b mb-4">
            <button 
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeSemester === 1 ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveSemester(1)}
            >
              Semester 1
            </button>
            <button 
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeSemester === 2 ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveSemester(2)}
            >
              Semester 2
            </button>
          </div>

          <div className="space-y-6 overflow-auto pr-2 pb-4">
            {currentSemesterItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Tidak ada topik untuk Semester {activeSemester}</p>
            ) : (
              currentSemesterItems.map((item, idx) => {
                // Find original index in the full array to update the correct item
                const realIdx = items.findIndex(i => i.id === item.id);
                
                const totalSlotJp = item.slots.reduce((sum, s) => sum + (Number(s.planned_jp) || 0), 0);
                const isOver = totalSlotJp > item.allocated_jp;
                const isUnder = totalSlotJp > 0 && totalSlotJp < item.allocated_jp;

                return (
                  <div key={item.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                    {/* Header Topik */}
                    <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">Topik {item.sequence}</span>
                          <h3 className="font-semibold text-slate-800">{item.materi_pokok}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Alokasi Total: <strong className="text-slate-700">{item.allocated_jp} JP</strong></p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`px-3 py-1 rounded-full font-medium ${
                          isOver ? 'bg-red-100 text-red-700' : 
                          isUnder ? 'bg-amber-100 text-amber-700' : 
                          'bg-green-100 text-green-700'
                        }`}>
                          Terjadwal: {totalSlotJp} / {item.allocated_jp} JP
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleAutoSuggest(realIdx)}>
                          <Wand2 className="w-3.5 h-3.5 mr-2" /> Auto Suggest
                        </Button>
                      </div>
                    </div>

                    {/* Slots List */}
                    <div className="p-4 space-y-3">
                      {item.slots.length === 0 ? (
                        <div className="text-center py-6 border border-dashed rounded bg-slate-50/50">
                          <p className="text-sm text-muted-foreground mb-3">Belum ada pertemuan untuk topik ini.</p>
                          <Button size="sm" variant="secondary" onClick={() => handleAutoSuggest(realIdx)}>
                            Generate Berdasarkan JP
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {item.slots.map((slot, sIdx) => (
                            <div key={sIdx} className="flex gap-3 items-center group">
                              <div className="w-12 text-center text-sm font-medium text-slate-400">#{slot.sequence}</div>
                              <div className="flex-1">
                                <Input 
                                  value={slot.title} 
                                  onChange={e => handleUpdateSlot(realIdx, sIdx, "title", e.target.value)} 
                                  placeholder="Nama Pertemuan" 
                                  className="h-9"
                                />
                              </div>
                              <div className="w-24 relative">
                                <Input 
                                  type="number"
                                  min="1"
                                  max="8"
                                  value={slot.planned_jp || ""} 
                                  onChange={e => handleUpdateSlot(realIdx, sIdx, "planned_jp", parseInt(e.target.value) || 0)} 
                                  className="h-9 pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">JP</span>
                              </div>
                              <div className="w-36 text-xs text-muted-foreground flex items-center gap-1 bg-slate-50 px-2 h-9 rounded border">
                                <Clock className="w-3.5 h-3.5" />
                                {slot.planned_jp ? `${slot.planned_jp * menitPerJp} menit` : '-'}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                onClick={() => handleRemoveSlot(realIdx, sIdx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-fit mt-1 text-primary hover:text-primary hover:bg-primary/5"
                            onClick={() => handleAddSlot(realIdx)}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Tambah Pertemuan
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <div className="pt-4 border-t flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || items.length === 0}>
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan & Kembali ke Dashboard"}
        </Button>
      </div>
    </div>
  );
};
