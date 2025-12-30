import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PatientService } from '@/application/services/patient.service';
import { Patient } from '@/domain/models';

/**
 * Composant pour la gestion des patients (Admin)
 */
@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss']
})
export class AdminPatientsComponent implements OnInit {
  patients: Patient[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    console.log('📋 AdminPatientsComponent.ngOnInit()');
    this.loadPatients();
  }

  /**
   * Charge tous les patients
   */
  loadPatients(): void {
    this.loading = true;
    this.error = null;
    console.log('🔄 Chargement des patients via API...');

    this.patientService.getAllPatients().subscribe({
      next: (patients: Patient[]) => {
        console.log('✅ Patients reçus:', patients?.length || 0);
        this.patients = patients || [];
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('❌ Erreur patients:', err);
        this.error = err.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  /**
   * Supprime un patient
   */
  deletePatient(patientId: string): void {
    if (confirm('Supprimer ce patient ?')) {
      this.loading = true;
      this.patientService.deletePatient(patientId).subscribe({
        next: () => {
          console.log('✅ Patient supprimé avec succès');
          this.loadPatients(); // Rafraîchir automatiquement
        },
        error: (err: Error) => {
          console.error('❌ Erreur suppression:', err);
          this.error = err.message || 'Erreur lors de la suppression';
          this.loading = false;
        }
      });
    }
  }
}

