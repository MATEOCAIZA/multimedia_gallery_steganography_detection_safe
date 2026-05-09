package proyecto_software_seguro.Proyecto.Primer.Parcial.de.Software.Seguro.config;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Argon2id: El estándar más alto para protección contra hardware de cracking (GPUs/ASICs)
        return new Argon2PasswordEncoder(16, 32, 1, 65536, 3);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 1. Configuración de CSRF (Synchronizer Token Pattern)
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                )
                // 2. Filtro para forzar la generación de la cookie XSRF-TOKEN
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)

                // 3. Cabeceras de Seguridad (RF05)
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; img-src 'self' data:;"))
                        .contentTypeOptions(Customizer.withDefaults()) // X-Content-Type-Options: nosniff
                )

                // 4. Control de Acceso Perimetral
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/albums/publico/**").permitAll() // Cualquiera puede VER
                        .requestMatchers("/api/public/view/**").permitAll()           // Cualquiera puede ver las FOTOS

                        // RESTRINGIMOS las acciones de modificación:
                        .requestMatchers(HttpMethod.POST, "/api/albums/**").hasRole("USER") // Solo USER crea
                        .requestMatchers("/api/admin/**").hasRole("SUPERVISOR")             // Solo SUPERVISOR audita

                        .anyRequest().authenticated()
                );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3001",
                "https://galeria-segura-espe.vercel.app"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-XSRF-TOKEN"));

        // 4. Cabeceras que el backend EXPONE al frontend (CRÍTICO para que Axios lea el token)
        configuration.setExposedHeaders(Arrays.asList("X-XSRF-TOKEN"));

        // 5. Permitir el envío de cookies (JSESSIONID)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}