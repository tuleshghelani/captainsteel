import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { CategoryComponent } from './components/category/category.component';
import { ProductComponent } from './components/product/product.component';
import { AuthGuard } from './guards/auth.guard';
import { PurchaseComponent } from './components/purchase/purchase.component';
import { AddPurchaseComponent } from './components/add-purchase/add-purchase.component';
import { SaleComponent } from './components/sale/sale.component';
import { ProfitComponent } from './components/profit/profit.component';
import { CustomerComponent } from './components/customer/customer.component';
import { AddCombinedPurchaseSaleComponent } from './components/add-combined-purchase-sale/add-combined-purchase-sale.component';
import { PowderCoatingProcessComponent } from './components/powder-coating/powder-coating-process/powder-coating-process.component';
import { AddPowderCoatingProcessComponent } from './components/powder-coating/add-powder-coating-process/add-powder-coating-process.component';
import { TransportComponent } from './components/Transports/transport/transport.component';
import { TransportListComponent } from './components/Transports/transport-list/transport-list.component';
import { EmployeeListComponent } from './components/employee/employee-list/employee-list.component';
import { EmployeeFormComponent } from './components/employee/employee-form/employee-form.component';
import { EmployeeOrderListComponent } from './components/employee-order/employee-order-list/employee-order-list.component';
import { EmployeeOrderFormComponent } from './components/employee-order/employee-order-form/employee-order-form.component';
import { DailyProfitComponent } from './components/all-profits/daily-profit/daily-profit.component';
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'category', 
    component: CategoryComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'product', 
    component: ProductComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'purchase', 
    component: PurchaseComponent, 
    canActivate: [AuthGuard] 
  },
  {
    path: 'purchase/create',
    component: AddPurchaseComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'sale',
    component: SaleComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profit',
    component: ProfitComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'customer',
    component: CustomerComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'combined-purchase-sale',
    component: AddCombinedPurchaseSaleComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'powder-coating-process',
    component: PowderCoatingProcessComponent,
    canActivate: [AuthGuard]
  },  
  {
    path: 'powder-coating-process/create',
    component: AddPowderCoatingProcessComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'powder-coating-process/edit/:id',
    component: AddPowderCoatingProcessComponent,
    title: 'Edit Powder Coating Process'
  },
  {
    path: 'transport/create',
    component: TransportComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'transport',
    component: TransportListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'transport/edit/:id',
    component: TransportComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'employee',
    component: EmployeeListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'employee/create',
    component: EmployeeFormComponent,
    canActivate: [AuthGuard]
  },  
  {
    path: 'employee/edit/:id',
    component: EmployeeFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'employee-order',
    component: EmployeeOrderListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'employee-order/create',
    component: EmployeeOrderFormComponent,
    canActivate: [AuthGuard]
  },  
  {
    path: 'employee-order/edit/:id',
    component: EmployeeOrderFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'daily-profit',
    component: DailyProfitComponent,
    canActivate: [AuthGuard]
  },  
  {
    path: '**',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }