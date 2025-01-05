import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() options: any[] = [];
  @Input() labelKey: string = 'name';
  @Input() valueKey: string = 'id';
  @Input() placeholder: string = 'Select an option';
  @Input() defaultOption: { label: string; value: any } | null = null;
  @Input() searchPlaceholder: string = 'Search...';
  @Input() multiple = false;

  searchText: string = '';
  isOpen: boolean = false;
  selectedValue: any = '';
  selectedValues: any[] = [];
  filteredOptions: any[] = [];
  
  onChange: any = () => {};
  onTouch: any = () => {};

  ngOnInit() {
    this.filteredOptions = this.options;
  }

  writeValue(value: any): void {
    if (this.multiple) {
      this.selectedValues = value || [];
    } else {
      this.selectedValue = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchText = '';
      this.filterOptions();
    }
  }

  onSearch(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value;
    this.filterOptions();
  }

  filterOptions() {
    this.filteredOptions = this.options.filter(option =>
      option[this.labelKey].toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  selectOption(option: any) {
    if (this.multiple) {
      const value = option[this.valueKey];
      const index = this.selectedValues.indexOf(value);
      
      if (index === -1) {
        this.selectedValues = [...this.selectedValues, value];
      } else {
        this.selectedValues = this.selectedValues.filter(v => v !== value);
      }
      
      this.onChange(this.selectedValues);
    } else {
      this.selectedValue = option[this.valueKey];
      this.onChange(this.selectedValue);
      this.isOpen = false;
    }
    this.onTouch();
  }

  isSelected(option: any): boolean {
    const value = option[this.valueKey];
    return this.multiple 
      ? this.selectedValues.includes(value)
      : this.selectedValue === value;
  }

  getSelectedLabel(): string {
    if (this.multiple) {
      return this.selectedValues.length 
        ? `${this.selectedValues.length} selected`
        : this.placeholder;
    }
    
    if (!this.selectedValue && this.defaultOption) {
      return this.defaultOption.label;
    }
    const selected = this.options.find(opt => opt[this.valueKey] === this.selectedValue);
    return selected ? selected[this.labelKey] : this.placeholder;
  }
} 