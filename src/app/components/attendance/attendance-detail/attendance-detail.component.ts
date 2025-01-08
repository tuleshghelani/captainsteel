import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-attendance-detail',
  templateUrl: './attendance-detail.component.html',
  styleUrl: './attendance-detail.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    RouterLink
  ]
})
export class AttendanceDetailComponent {

}
