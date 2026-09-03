import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, CalendarDays, BookOpen, Clock, Wand2 } from "lucide-react";
import { toast } from "sonner";
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
  isLocked?: boolean;
  onShowUpsell?: () => void;
}

export const StepMeeting: React.FC<StepMeetingProps> = ({ workspace, onNext, isLocked, onShowUpsell }) => {
  const [items, setItems] = useState<ProsemItem[]>([]);
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState<Record<number, boolean>>({});

  const defaultJpPerMeeting = workspace.default_jp_per_meeting || 2;
  const menitPerJp = workspace.jp_duration_minutes || 45;

  // Helper to parse weekly_jp_pattern (e.g. "3, 2" -> [3, 2])
  const parseWeeklyJpPattern = (pattern?: string): number[] => {
    if (!pattern || !pattern.trim()) return [defaultJpPerMeeting];
    const parsed = pattern.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    return parsed.length > 0 ? parsed : [defaultJpPerMeeting];
  };

  const jpPattern = parseWeeklyJpPattern(workspace.weekly_jp_pattern);

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

  const PROGRESSION = [
    "Eksplorasi awal, pengenalan konsep, pemantik diskusi",
    "Pendalaman konsep, latihan terbimbing, pengerjaan LKPD",
    "Praktik, eksperimen, atau proyek kelompok kecil",
    "Presentasi hasil, evaluasi, dan asesmen sumatif"
  ];

  const handleAutoSuggest = async (itemIndex: number) => {
    setIsGeneratingTitles(prev => ({ ...prev, [itemIndex]: true }));
    
    // Fallback logic
    const applyFallback = () => {
      setItems(prevItems => {
        const newItems = [...prevItems];
        const item = { ...newItems[itemIndex] };
        
        const newSlots: MeetingSlot[] = [];
        let remainingJp = item.allocated_jp;
        let jpForThisSlot = 0;
        let i = 0;
        
        while (remainingJp > 0) {
          // get the desired JP from the pattern for this meeting sequence
          const desiredJp = jpPattern[i % jpPattern.length];
          // don't allocate more than remaining
          jpForThisSlot = Math.min(remainingJp, desiredJp);
          
          let title = `Pertemuan ${i + 1}`;
          
          newSlots.push({
            sequence: i + 1,
            title,
            planned_jp: jpForThisSlot
          });
          remainingJp -= jpForThisSlot;
          i++;
        }
        
        // Update titles based on progression if needed
        const numMeetings = newSlots.length;
        for (let j = 0; j < numMeetings; j++) {
          let title = `Pertemuan ${j + 1}`;
          if (numMeetings === 1) {
            title = "Eksplorasi konsep, praktik, dan evaluasi";
          } else if (numMeetings === 2) {
            title = j === 0 ? PROGRESSION[0] : PROGRESSION[3];
          } else if (numMeetings === 3) {
            title = j === 0 ? PROGRESSION[0] : (j === 1 ? PROGRESSION[1] : PROGRESSION[3]);
          } else if (j < 3) {
            title = PROGRESSION[j];
          } else if (j === numMeetings - 1) {
            title = PROGRESSION[3];
          } else {
            title = PROGRESSION[2];
          }
          newSlots[j].title = title;
        }
        
        item.slots = newSlots;
        newItems[itemIndex] = item;
        return newItems;
      });
    };

    try {
      const item = items[itemIndex];
      // Simulate distribution to calculate number of meetings
      let tempRemainingJp = item.allocated_jp;
      let calculatedNumMeetings = 0;
      while (tempRemainingJp > 0) {
        const desiredJp = jpPattern[calculatedNumMeetings % jpPattern.length];
        tempRemainingJp -= Math.min(tempRemainingJp, desiredJp);
        calculatedNumMeetings++;
      }
      
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "meeting-titles",
          data: {
            mataPelajaran: workspace.subject || '',
            rumpun: workspace.subject, // simplified for now, can be expanded
            kelas: workspace.grade || '',
            fase: workspace.phase || '',
            judulTopik: item.materi_pokok,
            totalJP: item.allocated_jp,
            jumlahPertemuan: calculatedNumMeetings,
            jpPerPertemuan: defaultJpPerMeeting,
            polaJpMingguan: workspace.weekly_jp_pattern,
            menit: defaultJpPerMeeting * menitPerJp
          }
        }
      });

      if (error || !data || !data.success || !Array.isArray(data.titles) || data.titles.length === 0) {
        console.warn("AI Generation failed or returned empty. Using fallback.", error);
        toast.error("Gagal mendapatkan saran dari AI. Menggunakan format standar sementara. Silakan coba lagi nanti.");
        applyFallback();
      } else {
        // AI Success! Let's map it.
        setItems(prevItems => {
          const newItems = [...prevItems];
          const newItem = { ...newItems[itemIndex] };
          
          const newSlots: MeetingSlot[] = [];
          let remainingJp = newItem.allocated_jp;
          let i = 0;
          
          while (remainingJp > 0) {
            const desiredJp = jpPattern[i % jpPattern.length];
            const jpForThisSlot = Math.min(remainingJp, desiredJp);
            
            // Use AI title if available, otherwise fallback to string
            const aiTitle = data.titles[i];
            
            newSlots.push({
              sequence: i + 1,
              title: aiTitle || `Pertemuan ${i + 1}`,
              planned_jp: jpForThisSlot
            });
            remainingJp -= jpForThisSlot;
            i++;
          }
          
          newItem.slots = newSlots;
          newItems[itemIndex] = newItem;
          return newItems;
        });
      }
    } catch (err) {
      console.error("Auto Suggest Exception:", err);
      toast.error("Terjadi kesalahan sistem saat menghubungi AI. Menggunakan format standar sementara.");
      applyFallback();
    } finally {
      setIsGeneratingTitles(prev => ({ ...prev, [itemIndex]: false }));
    }
  };

  const handleAddSlot = (itemIndex: number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const item = { ...newItems[itemIndex] };
      
      item.slots = [...item.slots, {
        sequence: item.slots.length + 1,
        title: `Pertemuan ${item.slots.length + 1}`,
        planned_jp: defaultJpPerMeeting
      }];
      
      newItems[itemIndex] = item;
      return newItems;
    });
  };

  const handleUpdateSlot = (itemIndex: number, slotIndex: number, field: keyof MeetingSlot, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const item = { ...newItems[itemIndex] };
      const newSlots = [...item.slots];
      
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        [field]: value
      };
      
      item.slots = newSlots;
      newItems[itemIndex] = item;
      return newItems;
    });
  };

  const handleRemoveSlot = (itemIndex: number, slotIndex: number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const item = { ...newItems[itemIndex] };
      const newSlots = [...item.slots];
      
      newSlots.splice(slotIndex, 1);
      
      // Resequence remaining slots
      newSlots.forEach((s, i) => {
        s.sequence = i + 1;
      });
      
      item.slots = newSlots;
      newItems[itemIndex] = item;
      return newItems;
    });
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
          <div className="tabs-wrapper">
            <button 
              className={`tab-item ${activeSemester === 1 ? 'active' : ''}`}
              onClick={() => setActiveSemester(1)}
            >
              Semester 1
            </button>
            <button 
              className={`tab-item ${activeSemester === 2 ? 'active' : ''}`}
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
                  <div key={item.id} className="topik-card">
                    {/* Header Topik */}
                    <div className="card-head">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge-topik">Topik {item.sequence}</span>
                          <h3 className="font-semibold text-slate-800">{item.materi_pokok}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Alokasi Total: <strong className="text-slate-700">{item.allocated_jp} JP</strong></p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`badge-terjadwal ${
                          isOver ? 'err' : 
                          isUnder ? 'warn' : 
                          'ok'
                        }`}>
                          {isOver ? '✕ ' : isUnder ? '⚠ ' : '✓ '} Terjadwal: {totalSlotJp} / {item.allocated_jp} JP
                        </div>
                        <button className="btn-auto-suggest" disabled={isGeneratingTitles[realIdx]} onClick={() => {
                          if (isLocked && onShowUpsell) onShowUpsell();
                          else handleAutoSuggest(realIdx);
                        }}>
                          {isGeneratingTitles[realIdx] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                          Auto Suggest
                        </button>
                      </div>
                    </div>

                    {/* Slots List */}
                    <div className="p-4 space-y-3">
                      {item.slots.length === 0 ? (
                        <div className="text-center py-6 border border-dashed rounded bg-slate-50/50">
                          <p className="text-sm text-muted-foreground mb-3">Belum ada pertemuan untuk topik ini.</p>
                          <Button size="sm" variant="secondary" onClick={() => {
                            if (isLocked && onShowUpsell) onShowUpsell();
                            else handleAutoSuggest(realIdx);
                          }}>
                            Generate Berdasarkan JP
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4">
                          {item.slots.map((slot, sIdx) => (
                            <div key={sIdx} className="row-pertemuan group relative pr-10">
                              <div className="row-nomor">#{slot.sequence}</div>
                              <div className="flex-1">
                                <Input 
                                  value={slot.title} 
                                  onChange={e => handleUpdateSlot(realIdx, sIdx, "title", e.target.value)} 
                                  placeholder="Nama Pertemuan" 
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="w-24 relative">
                                <Input 
                                  type="number"
                                  min="1"
                                  max="8"
                                  value={slot.planned_jp || ""} 
                                  onChange={e => handleUpdateSlot(realIdx, sIdx, "planned_jp", parseInt(e.target.value) || 0)} 
                                  className="h-9 pr-8 bg-white"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">JP</span>
                              </div>
                              <div className="badge-durasi">
                                <Clock className="w-3.5 h-3.5" />
                                {slot.planned_jp ? `${slot.planned_jp * menitPerJp} menit` : '-'}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                onClick={() => handleRemoveSlot(realIdx, sIdx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          <button 
                            className="btn-tambah-pertemuan"
                            onClick={() => handleAddSlot(realIdx)}
                          >
                            <Plus className="w-4 h-4" /> Tambah Pertemuan
                          </button>
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

      <div className="pt-6 mt-4 border-t border-slate-200 flex justify-between items-center">
        <div className="footer-hint">Pastikan jumlah JP terjadwal sesuai dengan alokasi Prosem.</div>
        <button className="btn-simpan" onClick={handleSave} disabled={isSaving || items.length === 0}>
          {isSaving ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</span>
          ) : (
            "Simpan & Selesai"
          )}
        </button>
      </div>
    </div>
  );
};
