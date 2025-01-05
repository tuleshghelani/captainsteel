import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { HeaderComponent } from './components/shared/header/header.component';
import { CategoryComponent } from './components/category/category.component';
import { ProductComponent } from './components/product/product.component';
// import { PurchaseComponent } from './components/purchase/purchase.component';
// import { SalesComponent } from './components/sales/sales.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { AppRoutingModule } from './app-routing.module';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { AddCombinedPurchaseSaleComponent } from './components/add-combined-purchase-sale/add-combined-purchase-sale.component';
import { TransportComponent } from './components/Transports/transport/transport.component';
import { TransportListComponent } from './components/Transports/transport-list/transport-list.component';
    


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    // ProductComponent,
    // PurchaseComponent,
    // SalesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule,
    ToastrModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }