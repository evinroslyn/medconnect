import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Composant pour les paramètres de l'administrateur
 */
@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class AdminSettingsComponent {
  // TODO: Implémenter les paramètres
}

