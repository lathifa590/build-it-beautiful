import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QuotaIndicator } from "@/components/modul/QuotaIndicator";

describe("Setup Pengujian (Vitest & React Testing Library)", () => {
  describe("1. Unit Testing Sederhana", () => {
    it("harus memverifikasi logika matematika dasar", () => {
      const sum = (a: number, b: number) => a + b;
      expect(sum(2, 3)).toBe(5);
    });

    it("harus menangani operasi string dan array", () => {
      const appName = "Modul Ajar Generator";
      expect(appName).toContain("Modul Ajar");
      expect(["modul", "lkpd", "asesmen"]).toHaveLength(3);
    });
  });

  describe("2. React Component Testing (DOM & Testing Library)", () => {
    it("harus merender QuotaIndicator dengan batas kuota 50 untuk akun trial", () => {
      render(<QuotaIndicator remaining={45} limit={50} isTrial={true} />);
      
      const badge = screen.getByText(/Sisa: 45\/50/i);
      expect(badge).toBeInTheDocument();
    });

    it("harus menormalkan batas jika bernilai 100 menjadi 50", () => {
      render(<QuotaIndicator remaining={40} limit={100} isTrial={true} />);
      
      const badge = screen.getByText(/Sisa: 40\/50/i);
      expect(badge).toBeInTheDocument();
    });

    it("tidak boleh merender apapun jika bukan akun trial (isTrial=false)", () => {
      const { container } = render(<QuotaIndicator remaining={50} limit={50} isTrial={false} />);
      
      expect(container.firstChild).toBeNull();
    });
  });
});

