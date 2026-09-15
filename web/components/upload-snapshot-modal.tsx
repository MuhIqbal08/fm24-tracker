"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importSnapshotFile } from "@/lib/api";

interface UploadSnapshotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadSnapshotModal({ open, onOpenChange }: UploadSnapshotModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [seasonLabel, setSeasonLabel] = useState("");
  const [inGameDate, setInGameDate] = useState("");
  const [clubName, setClubName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const uploadMutation = useMutation({
    mutationFn: importSnapshotFile,
    onSuccess: (data) => {
      setSuccessMsg(`Berhasil mengimpor snapshot! ${data.total_players_imported} pemain tercatat.`);
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["squadComparison"] });
      setTimeout(() => {
        onOpenChange(false);
        setFile(null);
        setSeasonLabel("");
        setInGameDate("");
        setClubName("");
        setSuccessMsg("");
      }, 1500);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Gagal mengunggah snapshot.");
      setSuccessMsg("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Pilih file HTML export FM24 terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (seasonLabel) formData.append("season_label", seasonLabel);
    if (inGameDate) formData.append("in_game_date", inGameDate);
    if (clubName) formData.append("club_name", clubName);

    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-400" />
            Impor Ekspor FM24
          </DialogTitle>
          <DialogDescription>
            Unggah file HTML hasil ekspor FM24 (`Ctrl + P` &gt; Web Page) untuk menambahkan snapshot baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">File HTML FM24 (.html)</label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 text-center transition-colors cursor-pointer bg-slate-950/40">
              <input
                type="file"
                accept=".html,.htm"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0]);
                    setErrorMsg("");
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1">
                {file ? (
                  <>
                    <FileText className="h-8 w-8 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">{file.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-500 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">
                      Klik atau seret file HTML export ke sini
                    </span>
                    <span className="text-[11px] text-slate-500">Mendukung format squad export bawaan FM</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Label Musim (Opsional)</label>
              <Input
                placeholder="2024/2025 Awal Musim"
                value={seasonLabel}
                onChange={(e) => setSeasonLabel(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">In-Game Date (Opsional)</label>
              <Input
                placeholder="2024-07-01"
                value={inGameDate}
                onChange={(e) => setInGameDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nama Klub (Opsional)</label>
            <Input
              placeholder="Arsenal"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!file || uploadMutation.isPending}
              className="gap-1.5"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Impor Snapshot
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
