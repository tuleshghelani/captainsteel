import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SearchableSelectComponent } from '../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-add-quotation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LoaderComponent,
    SearchableSelectComponent
  ],
  templateUrl: './add-quotation.component.html',
  styleUrl: './add-quotation.component.scss'
})

export class AddQuotationComponent {
  loading:boolean = false
}
